import { tokenTransferActionToParticleGroupsMapper } from '../src/tokenTransferActionToParticleGroupsMapper'
import { TransferTokensAction, transferTokensAction } from '@radixdlt/actions'
import { Address } from '@radixdlt/crypto'
import {
	FixedSupplyTokenDefinitionParticle,
	fixedSupplyTokenDefinitionParticle,
	resourceIdentifierFromAddressAndName,
	TokenDefinitionParticleBase,
	TokenDefinitionParticleInput,
	transferrableTokensParticle,
	TransferrableTokensParticle,
	upParticle,
	UpParticle,
} from '@radixdlt/atom'
import {
	amountFromUInt256,
	Denomination,
	positiveAmountFromUnsafe,
} from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { toAddress } from '../../atom/test/helpers/utility'
import {
	testMapperReturns___Unknown_Token___error_when_no_token_definition_particle,
	testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles,
	testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles,
	testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses,
	testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else,
	testMapperReturns___works_with_change,
	testMapperReturns___works_without_change,
	bob,
	rri,
	alice,
	fixedSupTokDefParticle,
	TestCase,
	TestVector,
	mutableSupplyTokenDefinitionParticleAllCanMutate,
} from './consumeTokensActionToParticleGroupsMapperBase'

describe('TokenTransferActionToParticleGroupsMapper', () => {
	const mapper = tokenTransferActionToParticleGroupsMapper()

	const makeTransferAction = (
		amount: number = 1337,
	): TransferTokensAction => {
		return transferTokensAction({
			to: bob,
			from: alice,
			amount: positiveAmountFromUnsafe(amount)._unsafeUnwrap(),
			resourceIdentifier: rri,
		})
	}

	const testTransferActionWithToken = <T extends TokenDefinitionParticleBase>(
		tokenDefinitionParticle: T,
	): void => {
		const tests: TestCase<T>[] = [
			testMapperReturns___Unknown_Token___error_when_no_token_definition_particle,
			testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles,
			testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles,
			testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses,
			testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else,
			testMapperReturns___works_with_change,
			testMapperReturns___works_without_change,
		]

		const vector = <TestVector<T>>{
			mapper,
			makeAction: makeTransferAction,
			tokenDefinitionParticle: tokenDefinitionParticle,
		}

		tests.forEach((t) => t(vector))
	}

	describe('Transfer FixedSupply token', () => {
		testTransferActionWithToken(fixedSupTokDefParticle)
	})

	describe('Transfer MutableSupply token', () => {
		testTransferActionWithToken(
			mutableSupplyTokenDefinitionParticleAllCanMutate,
		)
	})
})
