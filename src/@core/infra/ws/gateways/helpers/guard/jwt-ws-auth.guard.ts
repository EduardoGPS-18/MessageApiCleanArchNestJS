import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { ValidateUserUseCaseI } from '../../../../../application/usecases';
import { DomainError } from '../../../../../domain/errors/domain.error';

@Injectable()
export class JwtWsAuthGuard implements CanActivate {
  constructor(private readonly validateUserUseCase: ValidateUserUseCaseI) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const wsCtx = context.switchToWs();
    const client = wsCtx.getClient<Socket>();

    const { authorization } = client.handshake.headers;

    if (!authorization) {
      throw new ForbiddenException();
    }
    const session = authorization.split(' ')[1];
    try {
      const user = await this.validateUserUseCase.execute({ session });
      client.data = {
        user,
      }; // TODO: Find a way to can test it
      return !!user;
    } catch (err) {
      if (err instanceof DomainError.InvalidUser) {
        throw new ForbiddenException();
      }
      throw new InternalServerErrorException();
    }
  }
}
