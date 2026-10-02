export interface IPasswordHasher {
  hash(password: string, saltOrRounds?: number | string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
