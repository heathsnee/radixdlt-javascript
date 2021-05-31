import { LedgerButtonPress, PromptUserForInput } from './emulatedLedger'

export enum LedgerInstruction {
	PING = 0x00,
	GET_VERSION = 0x01,
	GET_PUBLIC_KEY = 0x02,
	DO_KEY_EXCHANGE = 0x04,
	DO_SIGN_HASH = 0x08,
	DO_SIGN_TX = 0x16,
}

// https://github.com/radixdlt/radixdlt-ledger-app/blob/2eecabd2d870ebc252218d91034a767320b71487/app/src/common/common_macros.h#L37-L43
export enum LedgerResponseCodes {
	CLA_NOT_SUPPORTED = 0x6e00,

	SW_USER_REJECTED = 0x6985,
	SW_INVALID_MAC_CODE = 0x6986,
	SW_FATAL_ERROR_INCORRECT_IMPLEMENTATION = 0x6b00,
	SW_INVALID_PARAM = 0x6b01,
	SW_INVALID_INSTRUCTION = 0x6d00,
	SW_OK = 0x9000,
}
export const prettifyLedgerResponseCode = (code: LedgerResponseCodes): string =>
	`${code === LedgerResponseCodes.SW_OK ? '✅' : '❌'} code: '${
		LedgerResponseCodes[code]
	}' 0x${code.toString(16)} (0d${code.toString(10)})`

import { Observable, Subject } from 'rxjs'

export type CreateLedgerNanoTransportInput = Readonly<{
	openTimeout?: number
	listenTimeout?: number
}>

export const radixCLA: number = 0xaa

export type APDUT = Readonly<{
	// (type: 'number') Always to '0xAA'
	cla: number
	ins: number

	//  Will default to `0` if undefined
	p1: number

	// Should not be present if `p1` is 'undefined'. Will default to `0` if undefined
	p2: number

	// defaults to zero length buffer
	data?: Buffer

	// defaults to: `[SW_OK]`
	requiredResponseStatusCodeFromDevice: LedgerResponseCodes[]
}>

export type PartialAPDUT = Omit<
	APDUT,
	'p1' | 'p2' | 'requiredResponseStatusCodeFromDevice'
> &
	Readonly<{
		p1?: number

		// Should not be present if `p1` is 'undefined'. Will default to `0` if undefined
		p2?: number

		// defaults to: `[SW_OK]`
		requiredResponseStatusCodeFromDevice?: LedgerResponseCodes[]
	}>

export type RadixAPDUT = APDUT &
	Readonly<{
		cla: typeof radixCLA
		ins: LedgerInstruction
	}>

export type LedgerRequest = Readonly<{
	apdu: RadixAPDUT
	uuid: string
}>

export type LedgerResponse = Readonly<{
	data: Buffer
	uuid: string // should match one of request.
}>

export type LedgerNanoT = Readonly<{
	close: () => Observable<void>
	sendAPDUToDevice: (apdu: RadixAPDUT) => Observable<Buffer>
	__sendRequestToDevice: (
		request: LedgerRequest,
	) => Observable<LedgerResponse>
}>

export type RequestAndResponse = Readonly<{
	apdu: RadixAPDUT
	response: LedgerResponse
}>

export type UserOutputAndInput = Readonly<{
	toUser: PromptUserForInput
	fromUser: LedgerButtonPress
}>

export type MockedLedgerNanoStoreT = Readonly<{
	// IO between GUI wallet and Ledger Nano
	recorded: RequestAndResponse[]
	lastRnR: () => RequestAndResponse
	lastRequest: () => RadixAPDUT
	lastResponse: () => LedgerResponse

	// Input from user using buttons and output to user on display
	userIO: UserOutputAndInput[]
	lastUserInput: () => LedgerButtonPress
	lastPromptToUser: () => PromptUserForInput
}>

export type EmulatedLedgerIO = Readonly<{
	usersInputOnLedger: Subject<LedgerButtonPress>
	promptUserForInputOnLedger: Subject<PromptUserForInput>
}>

export type MockedLedgerNanoRecorderT = MockedLedgerNanoStoreT &
	EmulatedLedgerIO &
	Readonly<{
		recordRequest: (request: LedgerRequest) => void
		recordResponse: (response: LedgerResponse) => RequestAndResponse
	}>

export type MockedLedgerNanoT = LedgerNanoT &
	Readonly<{
		store: MockedLedgerNanoStoreT
	}>