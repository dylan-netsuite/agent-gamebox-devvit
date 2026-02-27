export interface InitResponse {
  type: 'init';
  postId: string;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
}
