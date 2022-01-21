export class MissingArgsError extends Error {
  constructor(message){
    super(message)
    this.name = "Missing Args"
  }
}
