export interface IResult {
  success: boolean;
  message: string;
}

export interface IDataResult<T> extends IResult {
  data: T;
}
