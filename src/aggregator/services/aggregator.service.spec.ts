import { HttpModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IBanksUser, BanksUserStatus } from '@algoan/rest';
import { AlgoanModule } from '../../algoan/algoan.module';
import { AppModule } from '../../app.module';
import {
  BudgetInsightAccount,
  AccountType,
  BudgetInsightTransaction,
  TransactionType,
  Connection,
} from '../interfaces/budget-insight.interface';
import { AggregatorService } from './aggregator.service';
import { BudgetInsightClient } from './budget-insight/budget-insight.client';

describe('AggregatorService', () => {
  let service: AggregatorService;
  let client: BudgetInsightClient;
  const mockBanksUser: IBanksUser = {
    id: 'id',
    callbackUrl: 'callbackUrl',
    status: BanksUserStatus.NEW,
    redirectUrl: 'mockRedirectUrl',
    redirectUrlCreatedAt: 1234567,
    redirectUrlTTL: 500,
    plugIn: {
      budgetInsightBank: {
        baseUrl: 'mockBaseUrl',
        token: 'mockToken',
      },
    },
    scores: [],
    analysis: { alerts: [], regularCashFlows: [], reliability: 'HIGH' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule, HttpModule, AlgoanModule],
      providers: [AggregatorService, BudgetInsightClient],
    }).compile();

    service = module.get<AggregatorService>(AggregatorService);
    client = module.get<BudgetInsightClient>(BudgetInsightClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register user on budget insight', async () => {
    const spy = jest.spyOn(client, 'register').mockReturnValue(Promise.resolve('permToken'));
    const token = 'token';
    await service.registerClient(token);

    expect(spy).toBeCalledWith(token);
  });

  it('should get the jwt token', async () => {
    const spy = jest.spyOn(client, 'getUserJWT').mockReturnValue(
      Promise.resolve({
        jwt_token: 'mockJwt',
        payload: {
          domain: 'mockDomain',
        },
      }),
    );
    await service.getJWToken();

    expect(spy).toBeCalled();
  });

  it('should create the webviewUrl base on the callbackUrl', () => {
    const url: string = service.generateRedirectUrl(mockBanksUser);
    expect(url).toBe(
      'http://localhost:4000/auth/webview/fr/connect?client_id=c&redirect_uri=callbackUrl&response_type=code&state=&types=banks',
    );
  });

  it('should get the accounts', async () => {
    const account: BudgetInsightAccount = {
      id: 1,
      id_connection: 2,
      id_user: 3,
      id_source: 4,
      id_parent: 5,
      number: 'mockNumber',
      original_name: 'mockOrginalName',
      coming: 'mockComing',
      currency: { id: 'id1' },
      balance: 100,
      name: 'mockName',
      last_update: 'mockLastUpdate',
      type: AccountType.CHECKING,
      iban: 'mockIban',
      bic: 'mockBic',
      disabled: false,
      company_name: 'mockCompany',
    };
    const spy = jest.spyOn(client, 'fetchBankAccounts').mockReturnValue(Promise.resolve([account]));
    const token = 'token';
    await service.getAccounts(token);

    expect(spy).toBeCalledWith(token);
  });

  it('should get the transactions', async () => {
    const transaction: BudgetInsightTransaction = {
      id_account: 5,
      id: 'mockId',
      application_date: 'mockApplicationDate',
      rdate: 'mockRdate',
      simplified_wording: 'mockSimplifiedWording',
      value: 50,
      card: 'mockCard',
      wording: 'mockWording',
      original_wording: 'mockSimplifiedWording',
      category: { name: 'mockName' },
      type: TransactionType.BANK,
    };
    const spy = jest.spyOn(client, 'fetchTransactions').mockReturnValue(Promise.resolve([transaction]));
    const token = 'token';
    const accountId = 7;
    await service.getTransactions(token, accountId);

    expect(spy).toBeCalledWith(token, accountId);
  });

  it('should get the connections', async () => {
    const connection: Connection = {
      id: 4,
      id_user: 6,
      id_connector: 5,
      last_update: 'mockLastUpdate',
      state: null,
      active: true,
      created: null,
      next_try: null,
    };
    const spy = jest.spyOn(client, 'fetchConnection').mockReturnValue(Promise.resolve([connection]));
    const token = 'token';
    await service.getConnections(token);

    expect(spy).toBeCalledWith(token);
  });
});
