# Lomash Wood Seed Generator

Generates realistic seed data for the Lomash Wood platform using `@faker-js/faker` and Prisma.

## Setup

```bash
pnpm install
```

## Usage

### Run All Seeds

```bash
pnpm seed
```

### Run Individual Seeds

```bash
pnpm seed:auth       # Users, sessions, roles
pnpm seed:product    # Products, categories, colours, sales, packages
pnpm seed:order      # Orders, payment transactions
pnpm seed:booking    # Appointments, brochure requests, business inquiries, newsletters
pnpm seed:content    # Blogs, home slider, media wall, finance content, reviews
pnpm seed:customer   # Showrooms, customer profiles, FAQs, accreditations
```

### Clear and Reseed

```bash
pnpm seed -- --clear
```

## Seed Order

Run in this order to satisfy foreign key constraints:

1. `auth` — base users
2. `product` — colours, categories, products, sales, packages
3. `customer` — showrooms, profiles, FAQs, accreditations
4. `order` — orders and payments (requires users + products)
5. `booking` — appointments (requires users + showrooms)
6. `content` — blogs, media, reviews (requires users)

## Default Credentials

| Role  | Email                        | Password                  |
|-------|------------------------------|---------------------------|
| Admin | admin@lomashwood.co.uk       | Admin@LomashWood2024!     |
| Staff | staff@lomashwood.co.uk       | Staff@LomashWood2024!     |
| Customer | (generated)             | Test@1234!                |

## Configuration

Edit `src/faker.config.ts` to adjust:

- Product ranges, styles, finishes
- UK postcodes and cities
- Colour definitions
- Randomisation helpers