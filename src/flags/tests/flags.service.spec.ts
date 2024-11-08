import { Test, TestingModule } from '@nestjs/testing';
import { Flags } from './flags.servicets';

describe('Flags', () => {
  let provider: Flags;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Flags],
    }).compile();

    provider = module.get<Flags>(Flags);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
