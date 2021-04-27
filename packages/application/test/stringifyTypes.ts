import BigNumber from 'bignumber.js'
import {
	ActionType,
	ExecutedAction,
	SimpleExecutedTransaction,
	SimpleTokenBalance,
	SimpleTokenBalances,
	SimpleTransactionHistory,
} from '../src'
import { AmountT } from '@radixdlt/primitives'

export const stringifyAmount = (amount: AmountT) => {
	const baseline = new BigNumber('0000000000000000001e-18')
	const bigNumber = new BigNumber(amount.toString())
	return bigNumber.multipliedBy(baseline).precision(4).toFormat()
}

export const stringifyAction = (action: ExecutedAction): string => {
	switch (action.type) {
		case ActionType.OTHER:
			return `
		Other
		`
		case ActionType.STAKE_TOKENS:
		case ActionType.UNSTAKE_TOKENS:
			return `
		type: ${action.type.toString()},
		from: ${action.from.toString()}
		validator: ${action.validator.toString()}
		amount: ${stringifyAmount(action.amount)}
		`
		case ActionType.TOKEN_TRANSFER:
			return `
		type: ${action.type.toString()},
		from: ${action.from.toString()}
		to: ${action.to.toString()}
		amount: ${stringifyAmount(action.amount)}
		rri: ${action.rri.toString()}
		`
	}
}

export const stringifySimpleTX = (tx: SimpleExecutedTransaction): string => {
	return `
	txID: ${tx.txID.toString()}
	fee: ${stringifyAmount(tx.fee)}
	sentAt: ${tx.sentAt.toLocaleString()}
	message: ${tx.message !== undefined ? tx.message : '<NONE>'}
	actions: [
	${tx.actions.map((a) => stringifyAction(a)).join('\n')}
	]
	`
}

export const stringifySimpleTXHistory = (
	simpleTxHist: SimpleTransactionHistory,
): string => {
	return `transactions: ${simpleTxHist.transactions
		.map((t) => stringifySimpleTX(t))
		.join('\n')}`
}

export const stringifySimpleTokenBalance = (tb: SimpleTokenBalance): string => {
	return `
		amount: ${stringifyAmount(tb.amount)}
		rri: ${tb.tokenIdentifier.toString()}
	`
}

export const stringifySimpleTokenBalances = (
	tokenBalances: SimpleTokenBalances,
): string => {
	return `
		owner: ${tokenBalances.owner.toString()},
		balances: ${tokenBalances.tokenBalances
			.map((tb) => stringifySimpleTokenBalance(tb))
			.join('\n')}
	`
}
