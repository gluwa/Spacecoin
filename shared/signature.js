const { ethers, network } = require('hardhat');

module.exports = {
    signTransfer: async function (
        name,
        version,
        contractAddress,
        wallet,
        targetAddress,
        amount,
        validAfter,
        validBefore,
        nonce
    ) {
        const signature = await wallet.signTypedData(
            {
                name,
                version,
                chainId: network.config.chainId,
                verifyingContract: contractAddress
            },
            {
                // TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)
                TransferWithAuthorization: [
                    {
                        name: 'from',
                        type: 'address'
                    },
                    {
                        name: 'to',
                        type: 'address'
                    },
                    {
                        name: 'value',
                        type: 'uint256'
                    },
                    {
                        name: 'validAfter',
                        type: 'uint256'
                    },
                    {
                        name: 'validBefore',
                        type: 'uint256'
                    },
                    {
                        name: 'nonce',
                        type: 'bytes32'
                    }
                ]
            },
            {
                from: wallet.address,
                to: targetAddress,
                value: amount,
                validAfter: validAfter,
                validBefore: validBefore,
                nonce: nonce
            }
        );
        return ethers.Signature.from(signature);
    },
    signReceive: async function (
        name,
        version,
        contractAddress,
        wallet,
        targetAddress,
        amount,
        validAfter,
        validBefore,
        nonce
    ) {
        const signature = await wallet.signTypedData(
            {
                name,
                version,
                chainId: network.config.chainId,
                verifyingContract: contractAddress
            },
            {
                // ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)
                ReceiveWithAuthorization: [
                    {
                        name: 'from',
                        type: 'address'
                    },
                    {
                        name: 'to',
                        type: 'address'
                    },
                    {
                        name: 'value',
                        type: 'uint256'
                    },
                    {
                        name: 'validAfter',
                        type: 'uint256'
                    },
                    {
                        name: 'validBefore',
                        type: 'uint256'
                    },
                    {
                        name: 'nonce',
                        type: 'bytes32'
                    }
                ]
            },
            {
                from: wallet.address,
                to: targetAddress,
                value: amount,
                validAfter: validAfter,
                validBefore: validBefore,
                nonce: nonce
            }
        );
        return ethers.Signature.from(signature);
    },
    signCancel: async function (
        name,
        version,
        contractAddress,
        wallet,
        nonce
    ) {
        const signature = await wallet.signTypedData(
            {
                name,
                version,
                chainId: network.config.chainId,
                verifyingContract: contractAddress
            },
            {
                // CancelAuthorization(address authorizer,bytes32 nonce)
                CancelAuthorization: [
                    {
                        name: 'authorizer',
                        type: 'address'
                    },
                    {
                        name: 'nonce',
                        type: 'bytes32'
                    }
                ]
            },
            {
                authorizer: wallet.address,
                nonce: nonce
            }
        );
        return ethers.Signature.from(signature);
    },
    signPermit: async function (
        name,
        version,
        contractAddress,
        wallet,
        targetAddress,
        amount,
        nonce,
        expirationTimestamp
    ) {
        const signature = await wallet.signTypedData(
            {
                name,
                version,
                chainId: network.config.chainId,
                verifyingContract: contractAddress
            },
            {
                // Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)
                Permit: [
                    {
                        name: 'owner',
                        type: 'address'
                    },
                    {
                        name: 'spender',
                        type: 'address'
                    },
                    {
                        name: 'value',
                        type: 'uint256'
                    },
                    {
                        name: 'nonce',
                        type: 'uint256'
                    },
                    {
                        name: 'deadline',
                        type: 'uint256'
                    }
                ]
            },
            {
                owner: wallet.address,
                spender: targetAddress,
                value: amount,
                nonce,
                deadline: expirationTimestamp
            }
        );
        return ethers.Signature.from(signature);
    }
};
