import { ReplaySubject, Subscription } from 'rxjs'
import {
	ECPointOnCurveT,
	PublicKeyT,
	Signature,
	Mnemonic,
	SignatureT,
} from '@radixdlt/crypto'
import { SemVerT, SemVer, HardwareWalletT } from '@radixdlt/hardware-wallet'
import {
	EmulatedLedgerIO,
	LedgerInstruction,
	MockedLedgerNanoStoreT,
	LedgerNano,
	MockedLedgerNanoRecorder,
	LedgerButtonPress,
	PromptUserForInput,
	PromptUserForInputType,
	HardwareWalletLedger,
} from '../src'
import {
	testDoKeyExchange,
	testDoSignHash,
	testGetPublicKey,
	testGetVersion,
} from './hardwareTestUtils'

describe('hardwareWallet_emulated', () => {
	const emulateHardwareWallet = (
		input: Readonly<{
			io?: EmulatedLedgerIO | undefined
			hardcodedVersion?: SemVerT
		}>,
	): { hardwareWallet: HardwareWalletT; store: MockedLedgerNanoStoreT } => {
		const { io, hardcodedVersion } = input
		const recorder = MockedLedgerNanoRecorder.create(io)

		const ledgerNano = LedgerNano.emulate({
			mnemonic: Mnemonic.fromEnglishPhrase(
				'equip will roof matter pink blind book anxiety banner elbow sun young',
			)._unsafeUnwrap(),
			recorder,
			version: hardcodedVersion,
		})

		const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

		return {
			hardwareWallet,
			store: recorder,
		}
	}

	describe('emulated', () => {
		it('getVersion', done => {
			const hardcodedVersion = SemVer.fromString('2.5.9')._unsafeUnwrap()

			const { store, hardwareWallet } = emulateHardwareWallet({
				hardcodedVersion,
			})

			testGetVersion({
				hardwareWallet,
				onResponse: (semVer: SemVerT) => {
					expect(store.recorded.length).toBe(1)
					const request = store.lastRequest()
					const response = store.lastResponse()

					// Assert request
					expect(request.cla).toBe(0xaa)
					expect(request.ins).toBe(0x01)
					expect(request.p1).toBe(0)
					expect(request.p2).toBe(0)
					expect(request.data).toBeUndefined()
					expect(
						request.requiredResponseStatusCodeFromDevice!,
					).toStrictEqual([0x9000])

					expect(semVer.toString()).toBe(hardcodedVersion.toString())
					expect(
						semVer.equals(
							SemVer.fromBuffer(response.data)._unsafeUnwrap(),
						),
					).toBe(true)

					done()
				},
			})
		})

		it('getPublicKey_emulated', done => {
			const subs = new Subscription()

			const usersInputOnLedger = new ReplaySubject<LedgerButtonPress>()
			const promptUserForInputOnLedger = new ReplaySubject<PromptUserForInput>()

			const { hardwareWallet, store } = emulateHardwareWallet({
				io: {
					usersInputOnLedger,
					promptUserForInputOnLedger,
				},
			})

			let numberOfPromptsToUser = 0

			subs.add(
				promptUserForInputOnLedger.subscribe({
					next: prompt => {
						if (
							prompt.type ===
							PromptUserForInputType.REQUIRE_CONFIRMATION
						) {
							if (
								prompt.instruction ===
								LedgerInstruction.GET_PUBLIC_KEY
							) {
								numberOfPromptsToUser += 1
							}
							usersInputOnLedger.next(
								LedgerButtonPress.RIGHT_ACCEPT,
							)
						}
					},
				}),
			)

			testGetPublicKey({
				hardwareWallet,
				requireConfirmationOnDevice: true,
				onResponse: (publicKey: PublicKeyT) => {
					expect(numberOfPromptsToUser).toBe(2)
					expect(store.userIO.length).toBe(2)

					expect(store.recorded.length).toBe(1)
					const request = store.lastRequest()
					const response = store.lastResponse()

					// Assert request
					expect(request.cla).toBe(0xaa)
					expect(request.ins).toBe(0x02)
					expect(request.p1).toBe(1)
					expect(request.p2).toBe(2)

					expect(request.data).toBeDefined()
					expect(request.data!.toString('hex')).toBe(
						'800000020000000100000003',
					)
					expect(
						request.requiredResponseStatusCodeFromDevice!,
					).toStrictEqual([0x9000])

					// Assert response
					expect(publicKey.toString(true)).toBe(
						response.data.toString('hex'),
					)

					done()
				},
			})
		})

		it('emulated_DoSignHash', done => {
			const subs = new Subscription()

			const usersInputOnLedger = new ReplaySubject<LedgerButtonPress>()
			const promptUserForInputOnLedger = new ReplaySubject<PromptUserForInput>()

			const { hardwareWallet, store } = emulateHardwareWallet({
				io: {
					usersInputOnLedger,
					promptUserForInputOnLedger,
				},
			})

			let userWasPromptedToConfirmSignHash = false

			subs.add(
				promptUserForInputOnLedger.subscribe({
					next: prompt => {
						if (
							prompt.type ===
							PromptUserForInputType.REQUIRE_CONFIRMATION
						) {
							userWasPromptedToConfirmSignHash =
								prompt.instruction ===
								LedgerInstruction.DO_SIGN_HASH
							usersInputOnLedger.next(
								LedgerButtonPress.RIGHT_ACCEPT,
							)
						}
					},
				}),
			)

			testDoSignHash({
				hardwareWallet,
				onResponse: (signature: SignatureT) => {
					expect(userWasPromptedToConfirmSignHash).toBe(true)

					expect(store.userIO.length).toBe(1)

					expect(store.recorded.length).toBe(1)
					const request = store.lastRequest()
					const response = store.lastResponse()

					// Assert request
					expect(request.cla).toBe(0xaa)
					expect(request.ins).toBe(0x08)
					expect(request.p1).toBe(1)
					expect(request.p2).toBe(0)
					expect(request.data).toBeDefined()
					expect(request.data!.toString('hex')).toBe(
						'800000020000000100000003be7515569e05daffc71bffe2a30365b74450c017a56184ee26699340a324d402',
					)
					expect(
						request.requiredResponseStatusCodeFromDevice!,
					).toStrictEqual([0x9000])

					// Assert response
					expect(
						signature.equals(
							Signature.fromRSBuffer(
								response.data,
							)._unsafeUnwrap(),
						),
					).toBe(true)

					done()
				},
			})
		})

		it('emulated_DoKeyExchange', done => {
			const subs = new Subscription()

			const usersInputOnLedger = new ReplaySubject<LedgerButtonPress>()
			const promptUserForInputOnLedger = new ReplaySubject<PromptUserForInput>()

			const { hardwareWallet, store } = emulateHardwareWallet({
				io: {
					usersInputOnLedger,
					promptUserForInputOnLedger,
				},
			})

			let userWasPromptedToConfirmKeyExchange = false

			subs.add(
				promptUserForInputOnLedger.subscribe({
					next: prompt => {
						if (
							prompt.type ===
							PromptUserForInputType.REQUIRE_CONFIRMATION
						) {
							userWasPromptedToConfirmKeyExchange =
								prompt.instruction ===
								LedgerInstruction.DO_KEY_EXCHANGE
							usersInputOnLedger.next(
								LedgerButtonPress.RIGHT_ACCEPT,
							)
						}
					},
				}),
			)

			testDoKeyExchange({
				hardwareWallet,
				requireConfirmationOnDevice: true,
				onResponse: (ecPointOnCurve: ECPointOnCurveT) => {
					expect(userWasPromptedToConfirmKeyExchange).toBe(true)
					expect(store.userIO.length).toBe(1)

					expect(store.recorded.length).toBe(1)
					const request = store.lastRequest()
					const response = store.lastResponse()

					// Assert request
					expect(request.cla).toBe(0xaa)
					expect(request.ins).toBe(0x04)
					expect(request.p1).toBe(1)
					expect(request.p2).toBe(0)
					expect(request.data).toBeDefined()
					expect(request.data!.toString('hex')).toBe(
						'8000000200000001000000030479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
					)
					expect(
						request.requiredResponseStatusCodeFromDevice!,
					).toStrictEqual([0x9000])

					// Assert response
					expect(ecPointOnCurve.toString()).toBe(
						response.data.toString('hex'),
					)

					done()
				},
			})
		})
	})
})