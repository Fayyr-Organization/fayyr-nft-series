import { assert, near } from "near-sdk-js";
import { Contract } from ".";

export function internalAddApprovedMinters({
    contract,
    accountId
}:{ 
    contract: Contract, 
    accountId: string
}): void {  
    // Assert the predecessor is the current account ID
    const predecessorAccountId = near.predecessorAccountId();
    assert(predecessorAccountId === near.currentAccountId(), "Only the current account can add approved minters");
    
    contract.approvedMinters.set(accountId);
}

export function internalRemoveApprovedMinters({
    contract,
    accountId
}:{ 
    contract: Contract, 
    accountId: string
}): void {  
    // Assert the predecessor is the current account ID
    const predecessorAccountId = near.predecessorAccountId();
    assert(predecessorAccountId === near.currentAccountId(), "Only the current account can remove approved minters");
    
    contract.approvedMinters.remove(accountId);
}

export function internalIsApprovedMinter({
    contract,
    accountId
}:{ 
    contract: Contract, 
    accountId: string
}): boolean {  
    return contract.approvedMinters.contains(accountId);
}

export function internalAddApprovedCreator({
    contract,
    accountId
}:{ 
    contract: Contract, 
    accountId: string
}): void {  
    // Assert the predecessor is the current account ID
    const predecessorAccountId = near.predecessorAccountId();
    assert(predecessorAccountId === near.currentAccountId(), "Only the current account can add approved creators");
    
    contract.approvedCreators.set(accountId);
}

export function internalRemoveApprovedCreator({
    contract,
    accountId
}:{ 
    contract: Contract, 
    accountId: string
}): void {  
    // Assert the predecessor is the current account ID
    const predecessorAccountId = near.predecessorAccountId();
    assert(predecessorAccountId === near.currentAccountId(), "Only the current account can remove approved creators");
    
    contract.approvedCreators.remove(accountId);
}

export function internalIsApprovedCreator({
    contract,
    accountId
}:{ 
    contract: Contract, 
    accountId: string
}): boolean {  
    return contract.approvedCreators.contains(accountId);
}