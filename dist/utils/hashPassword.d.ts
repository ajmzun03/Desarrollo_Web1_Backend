export declare function hassPassword(password: string): Promise<string>;
interface Props {
    input: string;
    hashedInput: string;
}
export declare function comparePassword({ input, hashedInput }: Props): Promise<boolean>;
export {};
//# sourceMappingURL=hashPassword.d.ts.map