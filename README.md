# Getting Started
1. `yarn && yarn build`
2. `near dev-deploy build/nft.wasm`
3. `near call $NFT_CONTRACT_ID create_series '{"id": 0, "metadata": {"title": "JS SDK Launch", "description": "Thank you for supporting our JavaScript launch! Welcome to the NEAR ecosystem.", "media": "https://bafybeihnb36l3xvpehkwpszthta4ic6bygjkyckp5cffxvszbcltzyjcwi.ipfs.nftstorage.link/", "copies": 400}}' --accountId $NFT_CONTRACT_ID --amount 1`
4. `near call $NFT_CONTRACT_ID nft_mint '{"id": 0, "receiver_id": "zbenji101.testnet", "injected_fields": 3}' --accountId $NFT_CONTRACT_ID --amount 1`