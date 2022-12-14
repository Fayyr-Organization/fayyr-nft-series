import { assert, near, UnorderedSet } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { internalAddTokenToOwner, refundDeposit } from "./internal";
import { Series, Token, TokenMetadata } from "./metadata";

export function internalMint({
    contract,
    id,
    receiverId
}:{
    contract: Contract,
    id: number,
    receiverId: string
}): void {
    let predecessor = near.predecessorAccountId();
    if(predecessor != near.currentAccountId()) {
        assert(contract.approvedMinters.contains(predecessor), "Not approved minter");
    }
    
    // @ts-ignore
    let series = contract.seriesById.get(id) as Series;
    if (series == null) {
        near.panic("no series");
    }
    let tokens = UnorderedSet.deserialize(series.tokens as UnorderedSet);
    let curLen = tokens.len();
    if(series.metadata.copies != null) {
        assert(curLen < series.metadata.copies, "Series is full");
    }

    let tokenId = `${id}:${curLen + 1}`;
    tokens.set(tokenId);
    series.tokens = tokens;
    // @ts-ignore
    contract.seriesById.set(id, series);

    //specify the token struct that contains the owner ID 
    let token = new Token ({
        series_id: id,
        //set the owner ID equal to the receiver ID passed into the function
        owner_id: receiverId,
        //we set the approved account IDs to the default value (an empty map)
        approved_account_ids: {},
        //the next approval ID is set to 0
        next_approval_id: 0
    });

    //insert the token ID and token struct and make sure that the token doesn't exist
    assert(contract.tokensById.get(tokenId) == null, "Token already exists");
    contract.tokensById.set(tokenId, token)

    //call the internal method for adding the token to the owner
    internalAddTokenToOwner(contract, token.owner_id, tokenId)

    // Construct the mint log as per the events standard.
    let nftMintLog = {
        // Standard name ("nep171").
        standard: NFT_STANDARD_NAME,
        // Version of the standard ("nft-1.0.0").
        version: NFT_METADATA_SPEC,
        // The data related with the event stored in a vector.
        event: "nft_mint",
        data: [
            {
                // Owner of the token.
                owner_id: token.owner_id,
                // Vector of token IDs that were minted.
                token_ids: [tokenId],
            }
        ]
    }
    
    // Log the json.
    near.log(`EVENT_JSON:${JSON.stringify(nftMintLog)}`);
}

export function internalCreateSeries({
    contract,
    id,
    metadata,
    royalty
}:{
    contract: Contract,
    id: number,
    metadata: TokenMetadata,
    royalty: { [accountId: string]: number }
}): void {
    //measure the initial storage being used on the contract TODO
    let initialStorageUsage = near.storageUsage();

    let predecessor = near.predecessorAccountId();
    if(predecessor != near.currentAccountId()) {
        assert(contract.approvedMinters.contains(predecessor), "Not approved minter");
    }
    // @ts-ignore
    assert(contract.seriesById.get(id) == null, "Series already exists");
    let series = new Series({
        metadata,
        royalty,
        tokens: new UnorderedSet(`${id}${predecessor}`),
        ownerId: predecessor
    });
    // @ts-ignore
    contract.seriesById.set(id, series);

    //calculate the required storage which was the used - initial TODO
    let requiredStorageInBytes = near.storageUsage().valueOf() - initialStorageUsage.valueOf();

    //refund any excess storage if the user attached too much. Panic if they didn't attach enough to cover the required.
    refundDeposit(requiredStorageInBytes);
}

export function internalUpdateSeriesId({
    contract,
    currentId,
    newId
}:{
    contract: Contract,
    currentId: number,
    newId: number
}): void {
    let caller = near.predecessorAccountId();
    // @ts-ignore
    let series = contract.seriesById.get(currentId) as Series;
    if (series == null) {
        near.panic("no series");
    }
    assert(series.owner_id == caller, "Not owner");
    // @ts-ignore
    assert(contract.seriesById.get(newId) == null, "New Series already exists");
    // @ts-ignore
    contract.seriesById.remove(currentId);
    // @ts-ignore
    contract.seriesById.set(newId, series);
}