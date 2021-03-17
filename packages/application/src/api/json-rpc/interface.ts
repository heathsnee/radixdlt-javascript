import { callAPI } from '../utils'
import {
	Endpoint,
	ExecutedTransactions,
	NativeToken,
	TokenBalances,
	UniverseMagic,
	TokenFeeForTransaction,
	Stakes,
	TransactionStatus,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	GetAtomForTransaction,
	SubmitSignedAtom,
} from './_types'
import { Result } from 'neverthrow'
import {
	handleExecutedTransactionsResponse,
	handleGetAtomForTxResponse,
	handleNativeTokenResponse,
	handleNetworkTxDemandResponse,
	handleNetworkTxThroughputResponse,
	handleStakesResponse,
	handleSubmitSignedAtomResponse,
	handleTokenBalancesResponse,
	handleTokenFeeForTxResponse,
	handleTransactionStatusResponse,
	handleUniverseMagicResponse,
} from './responseHandlers'

const setupAPICall = (
	call: (endpoint: Endpoint, ...params: unknown[]) => Promise<unknown>,
) => <I extends unknown[], R>(
	handleResponse: (response: unknown) => Result<R, Error[]>,
) => (endpoint: Endpoint) => callAPI<I, R>(endpoint)(call, handleResponse)

export const getAPI = (
	call: (endpoint: Endpoint, ...params: unknown[]) => Promise<unknown>,
) => {
	const setupAPIResponse = setupAPICall(call)

	return {
		universeMagic: setupAPIResponse<
			UniverseMagic.Input,
			UniverseMagic.DecodedResponse
		>(handleUniverseMagicResponse)(Endpoint.UNIVERSE_MAGIC),

		tokenBalances: setupAPIResponse<
			TokenBalances.Input,
			TokenBalances.DecodedResponse
		>(handleTokenBalancesResponse)(Endpoint.TOKEN_BALANCES),

		executedTransactions: setupAPIResponse<
			ExecutedTransactions.Input,
			ExecutedTransactions.DecodedResponse
		>(handleExecutedTransactionsResponse)(Endpoint.EXECUTED_TXS),

		nativeToken: setupAPIResponse<
			NativeToken.Input,
			NativeToken.DecodedResponse
		>(handleNativeTokenResponse)(Endpoint.NATIVE_TOKEN),

		tokenFeeForTransaction: setupAPIResponse<
			TokenFeeForTransaction.Input,
			TokenFeeForTransaction.DecodedResponse
		>(handleTokenFeeForTxResponse)(Endpoint.TOKEN_FEE_FOR_TX),

		stakes: setupAPIResponse<Stakes.Input, Stakes.DecodedResponse>(
			handleStakesResponse,
		)(Endpoint.STAKES),

		transactionStatus: setupAPIResponse<
			TransactionStatus.Input,
			TransactionStatus.DecodedResponse
		>(handleTransactionStatusResponse)(Endpoint.TX_STATUS),

		networkTransactionThroughput: setupAPIResponse<
			NetworkTransactionThroughput.Input,
			NetworkTransactionThroughput.DecodedResponse
		>(handleNetworkTxThroughputResponse)(Endpoint.NETWORK_TX_THROUGHPUT),

		networkTransactionDemand: setupAPIResponse<
			NetworkTransactionDemand.Input,
			NetworkTransactionDemand.DecodedResponse
		>(handleNetworkTxDemandResponse)(Endpoint.NETWORK_TX_DEMAND),

		getAtomForTransaction: setupAPIResponse<
			GetAtomForTransaction.Input,
			GetAtomForTransaction.DecodedResponse
		>(handleGetAtomForTxResponse)(Endpoint.GET_ATOM_FOR_TX),

		submitSignedAtom: setupAPIResponse<
			SubmitSignedAtom.Input,
			SubmitSignedAtom.DecodedResponse
		>(handleSubmitSignedAtomResponse)(Endpoint.SUBMIT_SIGNED_ATOM),
	}
}