import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { HttpExceptionFilter } from '../src/middleware/exception-logging.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const nonExistentUUID = '50b2b121-19cc-4644-8767-273e83b9c645'

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    // Configure the app with the same middleware as main.ts
    app.enableVersioning({
      type: VersioningType.URI,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    // Clean database before each test
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Auth', () => {
    const testUser = {
      email: 'test@example.com',
      password: '12345678',
    };

    describe('POST /v1/auth/signup', () => {
      it('should create a new user and return JWT token', () => {
        return request(app.getHttpServer())
          .post('/v1/auth/signup')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('token');
            expect(typeof res.body.token).toBe('string');
          });
      });

      it('should fail if email already exists', async () => {
        // First signup
        await request(app.getHttpServer())
          .post('/v1/auth/signup')
          .send(testUser);

        // Try to signup again with same email
        return request(app.getHttpServer())
          .post('/v1/auth/signup')
          .send(testUser)
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('already exists');
          });
      });

      it('should fail with invalid email format', () => {
        return request(app.getHttpServer())
          .post('/v1/auth/signup')
          .send({ ...testUser, email: 'invalid-email' })
          .expect(400);
      });

      it('should fail with short password', () => {
        return request(app.getHttpServer())
          .post('/v1/auth/signup')
          .send({ ...testUser, password: '123' })
          .expect(400);
      });
    });

    describe('POST /v1/auth/login', () => {
      beforeEach(async () => {
        // Create test user before login tests
        await request(app.getHttpServer())
          .post('/v1/auth/signup')
          .send(testUser);
      });

      it('should login successfully and return JWT token', () => {
        return request(app.getHttpServer())
          .post('/v1/auth/login')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('token');
            expect(typeof res.body.token).toBe('string');
          });
      });

      it('should fail with wrong password', () => {
        return request(app.getHttpServer())
          .post('/v1/auth/login')
          .send({ ...testUser, password: 'wrongpass' })
          .expect(401);
      });

      it('should fail with non-existent email', () => {
        return request(app.getHttpServer())
          .post('/v1/auth/login')
          .send({ ...testUser, email: 'nonexistent@example.com' })
          .expect(401);
      });
    });
  });

  describe('Documents', () => {
    let authToken: string;
    
    beforeEach(async () => {
      // Create user and get token for document tests
      const response = await request(app.getHttpServer())
        .post('/v1/auth/signup')
        .send({
          email: 'doc-test@example.com',
          password: '12345678',
        });
      authToken = response.body.token;
    });

    describe('POST /v1/documents', () => {
      it('should create a new document', () => {
        return request(app.getHttpServer())
          .post('/v1/documents')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Test Document' })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.title).toBe('Test Document');
          });
      });

      it('should fail without auth token', () => {
        return request(app.getHttpServer())
          .post('/v1/documents')
          .send({ title: 'Test Document' })
          .expect(401);
      });
    });

    describe('GET /v1/documents', () => {
      beforeEach(async () => {
        // Create test documents
        await request(app.getHttpServer())
          .post('/v1/documents')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Document 1' });
        
        await request(app.getHttpServer())
          .post('/v1/documents')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Document 2' });
      });

      it('should return all documents', () => {
        return request(app.getHttpServer())
          .get('/v1/documents')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('title');
          });
      });
    });

    describe('PUT /v1/documents/:id', () => {
      let documentId: string;

      beforeEach(async () => {
        // Create test document
        const response = await request(app.getHttpServer())
          .post('/v1/documents')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Original Title' });
        
        documentId = response.body.id;
      });

      it('should update document title', () => {
        return request(app.getHttpServer())
          .put(`/v1/documents/${documentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Updated Title' })
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(documentId);
            expect(res.body.title).toBe('Updated Title');
          });
      });

      it('should fail with non-existent document id', () => {
        return request(app.getHttpServer())
          .put(`/v1/documents/${nonExistentUUID}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Updated Title' })
          .expect(404);
      });

      it('should fail with document id in the wrong format', () => {
        return request(app.getHttpServer())
          .put(`/v1/documents/not-an-uuid`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Updated Title' })
          .expect(400);
      });
    });

    describe('DELETE /v1/documents/:id', () => {
      let documentId: string;

      beforeEach(async () => {
        // Create test document
        const response = await request(app.getHttpServer())
          .post('/v1/documents')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'To Be Deleted' });
        
        documentId = response.body.id;
      });

      it('should delete document', () => {
        return request(app.getHttpServer())
          .delete(`/v1/documents/${documentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(documentId);
          });
      });

      it('should fail with non-existent document id', () => {
        return request(app.getHttpServer())
          .delete(`/v1/documents/${nonExistentUUID}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('should fail with document id in the wrong format', () => {
        return request(app.getHttpServer())
          .delete(`/v1/documents/not-a-uuid`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
      });
    });
  });
});
