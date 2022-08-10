use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LazyOption, LookupMap, LookupSet, UnorderedMap, UnorderedSet};
use near_sdk::json_types::{Base64VecU8, U128};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near_bindgen, require, AccountId, Balance, BorshStorageKey, CryptoHash, PanicOnDefault,
    Promise, PromiseOrValue,
};
use std::collections::HashMap;

pub use crate::approval::*;
pub use crate::events::*;
use crate::internal::*;
pub use crate::metadata::*;
pub use crate::nft_core::*;
pub use crate::owner::*;
pub use crate::royalty::*;
pub use crate::series::*;

mod approval;
mod enumeration;
mod events;
mod internal;
mod metadata;
mod nft_core;
mod owner;
mod royalty;
mod series;

/// This spec can be treated like a version of the standard.
pub const NFT_METADATA_SPEC: &str = "nft-1.0.0";
/// This is the name of the NFT standard we're using
pub const NFT_STANDARD_NAME: &str = "nep171";

// Represents the series type. All tokens will derive this data.
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Series {
    // Metadata including title, num copies etc.. that all tokens will derive from
    metadata: TokenMetadata,
    // Royalty used for all tokens in the collection
    royalty: Option<HashMap<AccountId, u32>>,
    // Set of tokens in the collection
    tokens: UnorderedSet<TokenId>,
    // Owner of the collection (they can update collection ID)
    owner_id: AccountId,
}

pub type CollectionId = u64;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    //contract owner
    pub owner_id: AccountId,

    //approved minters
    pub approved_minters: LookupSet<AccountId>,

    //approved users that can create series
    pub approved_creators: LookupSet<AccountId>,

    //Map the collection ID (stored in Token obj) to the collection data
    pub series_by_id: UnorderedMap<CollectionId, Series>,

    //keeps track of the token struct for a given token ID
    pub tokens_by_id: UnorderedMap<TokenId, Token>,

    //keeps track of all the token IDs for a given account
    pub tokens_per_owner: LookupMap<AccountId, UnorderedSet<TokenId>>,

    //keeps track of the metadata for the contract
    pub metadata: LazyOption<NFTContractMetadata>,
}

/// Helper structure for keys of the persistent collections.
#[derive(BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    ApprovedMinters,
    ApprovedCreators,
    SeriesById,
    SeriesByIdInner { account_id_hash: CryptoHash },
    TokensPerOwner,
    TokenPerOwnerInner { account_id_hash: CryptoHash },
    TokensById,
    NFTContractMetadata,
}

#[near_bindgen]
impl Contract {
    /*
        initialization function (can only be called once).
        this initializes the contract with default metadata so the
        user doesn't have to manually type metadata.
    */
    #[init]
    pub fn new_default_meta(owner_id: AccountId) -> Self {
        //calls the other function "new: with some default metadata and the owner_id passed in
        Self::new(
            owner_id,
            NFTContractMetadata {
                spec: "nft-1.0.0".to_string(),
                name: "Eth Toronto NFT Linkdrop Contract".to_string(),
                symbol: "NEAR".to_string(),
                icon: Some("data:image/png;base64,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".to_string()),
                base_uri: None,
                reference: None,
                reference_hash: None,
            },
        )
    }

    /*
        initialization function (can only be called once).
        this initializes the contract with metadata that was passed in and
        the owner_id.
    */
    #[init]
    pub fn new(owner_id: AccountId, metadata: NFTContractMetadata) -> Self {
        //create a variable of type Self with all the fields initialized.
        let mut approved_minters =
            LookupSet::new(StorageKey::ApprovedMinters.try_to_vec().unwrap());
        approved_minters.insert(&owner_id);

        let mut approved_creators =
            LookupSet::new(StorageKey::ApprovedCreators.try_to_vec().unwrap());
        approved_creators.insert(&owner_id);

        let this = Self {
            approved_minters,
            approved_creators,
            series_by_id: UnorderedMap::new(StorageKey::SeriesById.try_to_vec().unwrap()),
            //Storage keys are simply the prefixes used for the collections. This helps avoid data collision
            tokens_per_owner: LookupMap::new(StorageKey::TokensPerOwner.try_to_vec().unwrap()),
            tokens_by_id: UnorderedMap::new(StorageKey::TokensById.try_to_vec().unwrap()),
            //set the &owner_id field equal to the passed in owner_id.
            owner_id,
            metadata: LazyOption::new(
                StorageKey::NFTContractMetadata.try_to_vec().unwrap(),
                Some(&metadata),
            ),
        };

        //return the Contract object
        this
    }
}