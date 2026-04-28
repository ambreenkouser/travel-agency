-- Banks and fintech/EMI list managed by super_admin
CREATE TABLE IF NOT EXISTS banks (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    short_name    VARCHAR(50),
    type          VARCHAR(20) NOT NULL DEFAULT 'BANK',
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT ALL ON TABLE banks TO travel_user;
GRANT USAGE, SELECT ON SEQUENCE banks_id_seq TO travel_user;

-- Seed Pakistan banks
INSERT INTO banks (name, short_name, type, display_order) VALUES
  ('National Bank of Pakistan',               'NBP',   'BANK', 1),
  ('Habib Bank Limited',                      'HBL',   'BANK', 2),
  ('United Bank Limited',                     'UBL',   'BANK', 3),
  ('MCB Bank Limited',                        'MCB',   'BANK', 4),
  ('Allied Bank Limited',                     'ABL',   'BANK', 5),
  ('Bank Alfalah',                            'BAFL',  'BANK', 6),
  ('Meezan Bank',                             'MEZN',  'BANK', 7),
  ('Bank Al Habib',                           'BAHL',  'BANK', 8),
  ('Askari Bank',                             'AKBL',  'BANK', 9),
  ('Faysal Bank',                             'FABL',  'BANK', 10),
  ('Bank of Punjab',                          'BOP',   'BANK', 11),
  ('Soneri Bank',                             'SNBL',  'BANK', 12),
  ('Habib Metropolitan Bank',                 'HMB',   'BANK', 13),
  ('JS Bank',                                 'JSBL',  'BANK', 14),
  ('Standard Chartered Bank Pakistan',        'SCBPL', 'BANK', 15),
  ('Silk Bank',                               'SILK',  'BANK', 16),
  ('BankIslami Pakistan',                     'BIPL',  'BANK', 17),
  ('Al Baraka Bank Pakistan',                 'ABRK',  'BANK', 18),
  ('Dubai Islamic Bank Pakistan',             'DIBP',  'BANK', 19),
  ('Bank of Khyber',                          'BOK',   'BANK', 20),
  ('Sindh Bank',                              'SIND',  'BANK', 21),
  ('First Women Bank',                        'FWB',   'BANK', 22),
  ('Zarai Taraqiati Bank',                    'ZTBL',  'BANK', 23),
  ('Industrial and Commercial Bank of China', 'ICBC',  'BANK', 24),
  ('EasyPaisa',                               'EP',    'FINTECH', 1),
  ('JazzCash',                                'JC',    'FINTECH', 2),
  ('SadaPay',                                 'SADA',  'FINTECH', 3),
  ('NayaPay',                                 'NAYA',  'FINTECH', 4),
  ('Upaisa',                                  'UP',    'FINTECH', 5),
  ('HBL Konnect',                             'HBLK',  'FINTECH', 6),
  ('Finja',                                   'FNJA',  'FINTECH', 7),
  ('PayMax',                                  'PMAX',  'FINTECH', 8);

-- Restructure payment_accounts: drop old columns, add new ones
ALTER TABLE payment_accounts
  DROP COLUMN IF EXISTS account_number,
  DROP COLUMN IF EXISTS bank_name,
  DROP COLUMN IF EXISTS account_type,
  ADD COLUMN IF NOT EXISTS bank_id              BIGINT REFERENCES banks(id),
  ADD COLUMN IF NOT EXISTS account_name         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bank_account_number  VARCHAR(100);
