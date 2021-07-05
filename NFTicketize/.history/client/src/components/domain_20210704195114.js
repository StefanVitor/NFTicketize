

type ERC721LazyMint = {
	"@type": "ERC721",
	contract: string,
	tokenId: string,
	uri: string,
	creators: Part[],
	royalties: Part[],
	signatures: string[]
}
type ERC1155LazyMint = {
	"@type": "ERC1155",
	contract: string,
	tokenId: string,
	uri: string,
	creators: Part[],
	royalties: Part[],
	supply: string,
	signatures: string[]
}

export type Part = {
	account: string
	value: string
}

export type LazyMint = ERC721LazyMint | ERC1155LazyMint

export const ERC721Types = {
	Part: [
		{name: 'account', type: 'address'},
		{name: 'value', type: 'uint96'}
	],
	Mint721: [
		{name: 'tokenId', type: 'uint256'},
		{name: 'tokenURI', type: 'string'},
		{name: 'creators', type: 'Part[]'},
		{name: 'royalties', type: 'Part[]'}
	]
};

export const ERC1155Types = {
	Part: [
		{name: 'account', type: 'address'},
		{name: 'value', type: 'uint96'}
	],
	Mint1155: [
		{name: 'tokenId', type: 'uint256'},
		{name: 'supply', type: 'uint256'},
		{name: 'tokenURI', type: 'string'},
		{name: 'creators', type: 'Part[]'},
		{name: 'royalties', type: 'Part[]'}
	]
};
