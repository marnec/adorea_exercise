import { HttpService } from '@nestjs/axios';
import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import axios, { AxiosError } from 'axios';
import { catchError, from, map, Observable, switchMap, tap } from 'rxjs';
import { AuthSessionsRepository } from 'src/auth-sessions/auth-sessions.repository';
import { PrismaErrorCodes } from 'src/constants';
import { inspect } from 'util';
import { ImportedDocumentDto } from './dto/imported-document.dto';
import { RemoteDocumentDto } from './dto/remote-document.dto';
import { ServiceACredentials } from './dto/service-a-credentials.dto';
import { ServiceAAuthDto } from './service-a-auth.dto';

@Injectable()
export class ServiceAClient {
  private readonly logger = new Logger(ServiceAClient.name);
  private readonly serviceId = this.SERVICE_A_HOST;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    private readonly authSessionsRepository: AuthSessionsRepository,
  ) {}

  private get SERVICE_A_HOST() {
    return this.config.getOrThrow<string>('SERVICE_A_HOST');
  }

  private get SERVICE_A_API_VERSION() {
    return this.config.getOrThrow<string>('SERVICE_A_API_VERSION');
  }

  private get SERVICE_A_DOCS_URL() {
    const host = this.SERVICE_A_HOST;
    const version = this.SERVICE_A_API_VERSION;
    const path = this.config.getOrThrow<string>('SERVICE_A_DOCS_PATH');
    return `${host}/${version}/${path}`;
  }

  private get SERVICE_A_AUTH_URL() {
    const host = this.SERVICE_A_HOST;
    const version = this.SERVICE_A_API_VERSION;
    const path = this.config.getOrThrow<string>('SERVICE_A_AUTH_PATH');
    return `${host}/${version}/${path}`;
  }

  private getAuthHeaders(authDto: ServiceAAuthDto) {
    // admittedly I'm probably abstracting too much logic here because it is not immediately clear
    // that if no session is found this function throws, triggering the login.
    return from(this.authSessionsRepository.getSession(authDto.email, this.serviceId)).pipe(
      map(({ token }) => token),
      catchError(() => this.login(authDto).pipe(catchError(() => null))),
      tap((token) => {
        if (!token) throw new UnauthorizedException('Not authenticated');
      }),
      map((token) => ({ Authorization: `Bearer ${token}` })),
    );
  }

  public login(authDto: ServiceAAuthDto) {
    this.logger.log(`Contacting service="${this.serviceId}" to authenticate`);

    const url = `${this.SERVICE_A_AUTH_URL}/login`;

    const headers = { 'Content-Type': 'application/json' };

    return this.http.post<ServiceACredentials>(url, authDto, { headers }).pipe(
      map(({ data }) => data.token),
      catchError((err: AxiosError) => {
        if (err.status === HttpStatus.FORBIDDEN || err.status === HttpStatus.UNAUTHORIZED) throw err;

        throw new InternalServerErrorException(
          `An unexpected error occurred while authenticating on service="${this.serviceId}", ${inspect(err)}`,
        );
      }),
      tap((token) => {
        // intentionally left unwaited, this should not prevent normal operations
        // this is just an asynchronous operation, executed asynchoronously, that depends on the token
        this.authSessionsRepository.createSession(authDto.email, this.serviceId, token).catch((err) => {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === PrismaErrorCodes.UNIQUE_CONSTRAINT_FAIL
          ) {
            this.logger.error(
              `The login process attempted to store a duplicate session 
              for user="${authDto.email}" and service="${this.serviceId}". Skipping operation`,
            );
          }
          this.logger.warn(
            `An unknown problem arose while storing an auth session 
            for user="${authDto.email}" and service="${this.serviceId}". 
            Skipping operation. Original error: ${inspect(err)}`,
          );
        });
      }),
    );
  }

  getList(authDto: ServiceAAuthDto): Observable<ImportedDocumentDto[]> {
    this.logger.log(`Fetching all documents from service="${this.serviceId}" at url="${this.SERVICE_A_DOCS_URL}" `);

    return this.getAuthHeaders(authDto).pipe(
      switchMap((headers) => this.http.get<RemoteDocumentDto[]>(this.SERVICE_A_DOCS_URL, { headers })),
      map(({ data }) => {
        return data.map(({ id, title }) => ({ refKey: id, title }) as ImportedDocumentDto);
      }),
      catchError(async (error) => {
        if (axios.isAxiosError(error)) {
          switch (error.status) {
            case HttpStatus.FORBIDDEN:
            case HttpStatus.UNAUTHORIZED:
              // refresh token logic (missing)
              // if this operation keeps failing I'll never
              // remove the expired token and I'm locked out of authentication. This part obviously would
              // not be production ready
              return this.authSessionsRepository.deleteSession(authDto.email, this.serviceId).then(() => {
                throw new UnauthorizedException(
                  `I tried to use an invalid token to login. There should be a refresh logic here; The invalid session was deleted. Retry`,
                );
              });
          }
        }
        throw new InternalServerErrorException(
          `An unexpected error occurred while fetching remote documents at service="${this.serviceId}", ${inspect(error)}`,
        );
      }),
    );
  }

  get(id: string, authDto: ServiceAAuthDto): Observable<ImportedDocumentDto> {
    const url = `${this.SERVICE_A_DOCS_URL}/${id}`;

    this.logger.log(`Fetching on document from service="${this.serviceId}" at url="${url}"`);

    return this.getAuthHeaders(authDto).pipe(
      switchMap((headers) => this.http.get<RemoteDocumentDto>(url, { headers })),
      map(({ data }) => {
        const { id, title } = data;
        return { refKey: id, title } as ImportedDocumentDto;
      }),
      catchError(async (error) => {
        if (axios.isAxiosError(error)) {
          switch (error.status) {
            case HttpStatus.NOT_FOUND:
              throw new NotFoundException(`Document not found in service="${this.serviceId}" with id="${id}"`);
            case HttpStatus.FORBIDDEN:
            case HttpStatus.UNAUTHORIZED:
              // refresh token logic (missing)
              // if this operation keeps failing I'll never
              // remove the expired token and I'm locked out of authentication. This part obviously would
              // not be production ready
              return this.authSessionsRepository.deleteSession(authDto.email, this.serviceId).then(() => {
                throw new UnauthorizedException(
                  `I tried to use an invalid token to login. There should be a refresh logic here; The invalid session was deleted. Retry`,
                );
              });
          }
        }
        throw new InternalServerErrorException(
          `An unexpected error occurred while fetching remote document="${id}" at service="${this.serviceId}", ${inspect(error)}`,
        );
      }),
    );
  }

  create(title: string, authDto: ServiceAAuthDto): Observable<RemoteDocumentDto> {
    this.logger.log(`Creating new document in service="${this.serviceId}" at url="${this.SERVICE_A_DOCS_URL}"`);

    return this.getAuthHeaders(authDto).pipe(
      switchMap((headers) => this.http.post<RemoteDocumentDto>(this.SERVICE_A_DOCS_URL, { title }, { headers })),
      map(({ data }) => data),
      catchError(async (error) => {
        if (axios.isAxiosError(error)) {
          switch (error.status) {
            case HttpStatus.FORBIDDEN:
            case HttpStatus.UNAUTHORIZED:
              // refresh token logic (missing)
              // if this operation keeps failing I'll never
              // remove the expired token and I'm locked out of authentication. This part obviously would
              // not be production ready
              return this.authSessionsRepository.deleteSession(authDto.email, this.serviceId).then(() => {
                throw new UnauthorizedException(
                  `I tried to use an invalid token to login. There should be a refresh logic here; The invalid session was deleted. Retry`,
                );
              });
          }
        }
        throw new InternalServerErrorException(
          `An unexpected error while creating a remote document at service="${this.serviceId}", ${inspect(error)}`,
        );
      }),
    );
  }

  update(id: string, title: string, authDto: ServiceAAuthDto): Observable<RemoteDocumentDto> {
    this.logger.log(
      `Updating remote document="${id}" in service="${this.serviceId}" at url="${this.SERVICE_A_DOCS_URL}"`,
    );

    return this.getAuthHeaders(authDto).pipe(
      switchMap((headers) =>
        this.http.put<RemoteDocumentDto>(`${this.SERVICE_A_DOCS_URL}/${id}`, { title }, { headers }),
      ),
      map(({ data }) => data),
      catchError(async (error) => {
        if (axios.isAxiosError(error)) {
          switch (error.status) {
            case HttpStatus.NOT_FOUND:
              throw new NotFoundException(`Document not found in service="${this.serviceId}" with id="${id}"`);
            case HttpStatus.FORBIDDEN:
            case HttpStatus.UNAUTHORIZED:
              // refresh token logic (missing)
              // if this operation keeps failing I'll never
              // remove the expired token and I'm locked out of authentication. This part obviously would
              // not be production ready
              return this.authSessionsRepository.deleteSession(authDto.email, this.serviceId).then(() => {
                throw new UnauthorizedException(
                  `I tried to use an invalid token to login. There should be a refresh logic here; The invalid session was deleted. Retry`,
                );
              });
          }
        }
        throw new InternalServerErrorException(
          `An unexpected error while updating remote document="${id}" at service="${this.serviceId}", ${inspect(error)}`,
        );
      }),
    );
  }

  delete(id: string, authDto: ServiceAAuthDto): Observable<RemoteDocumentDto> {
    this.logger.log(
      `Removing remote document="${id}" in service="${this.serviceId}" at url="${this.SERVICE_A_DOCS_URL}"`,
    );

    return this.getAuthHeaders(authDto).pipe(
      switchMap((headers) => this.http.delete<RemoteDocumentDto>(`${this.SERVICE_A_DOCS_URL}/${id}`, { headers })),
      map(({ data }) => data),
      catchError(async (error) => {
        if (axios.isAxiosError(error)) {
          switch (error.status) {
            case HttpStatus.NOT_FOUND:
              throw new NotFoundException(`Document not found in service="${this.serviceId}" with id="${id}"`);
            case HttpStatus.FORBIDDEN:
            case HttpStatus.UNAUTHORIZED:
              // refresh token logic (missing)
              // if this operation keeps failing I'll never
              // remove the expired token and I'm locked out of authentication. This part obviously would
              // not be production ready
              return this.authSessionsRepository.deleteSession(authDto.email, this.serviceId).then(() => {
                throw new UnauthorizedException(
                  `I tried to use an expired token to login. There should be a refresh logic here; The expired record was deleted. Retry`,
                );
              });
          }
        }
        throw new InternalServerErrorException(
          `An unexpected error while deleting remote document="${id}" at service="${this.serviceId}", ${inspect(error)}`,
        );
      }),
    );
  }
}
