

CREATE TABLE customers (
    id          NVARCHAR(36)  NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    user_id     NVARCHAR(255) NOT NULL,
    email       NVARCHAR(255) NOT NULL,
    first_name  NVARCHAR(100) NOT NULL,
    last_name   NVARCHAR(100) NOT NULL,
    phone       NVARCHAR(50),
    avatar_url  NVARCHAR(500),
    is_active   BIT           NOT NULL DEFAULT 1,
    deleted_at  DATETIME2,
    created_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    updated_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT customers_pk PRIMARY KEY (id)
);

CREATE UNIQUE INDEX customers_user_id_key ON customers(user_id);
CREATE UNIQUE INDEX customers_email_key   ON customers(email);
CREATE INDEX customers_is_active_idx      ON customers(is_active);
CREATE INDEX customers_deleted_at_idx     ON customers(deleted_at);


CREATE TABLE customer_profiles (
    id                 NVARCHAR(36)  NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    customer_id        NVARCHAR(36)  NOT NULL,
    date_of_birth      DATE,
    gender             NVARCHAR(50),
    bio                NVARCHAR(MAX),
    preferred_language NVARCHAR(10)  NOT NULL DEFAULT 'en',
    preferred_currency NVARCHAR(10)  NOT NULL DEFAULT 'GBP',
    marketing_opt_in   BIT           NOT NULL DEFAULT 0,
    sms_opt_in         BIT           NOT NULL DEFAULT 0,
    push_opt_in        BIT           NOT NULL DEFAULT 0,
    created_at         DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    updated_at         DATETIME2     NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT customer_profiles_pk PRIMARY KEY (id),
    CONSTRAINT customer_profiles_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX customer_profiles_customer_id_key ON customer_profiles(customer_id);


CREATE TABLE customer_addresses (
    id          NVARCHAR(36)  NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    customer_id NVARCHAR(36)  NOT NULL,
    label       NVARCHAR(100) NOT NULL DEFAULT 'Home',
    line1       NVARCHAR(255) NOT NULL,
    line2       NVARCHAR(255),
    city        NVARCHAR(100) NOT NULL,
    county      NVARCHAR(100),
    postcode    NVARCHAR(20)  NOT NULL,
    country     NVARCHAR(10)  NOT NULL DEFAULT 'GB',
    is_default  BIT           NOT NULL DEFAULT 0,
    deleted_at  DATETIME2,
    created_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    updated_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT customer_addresses_pk PRIMARY KEY (id),
    CONSTRAINT customer_addresses_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX customer_addresses_customer_id_idx ON customer_addresses(customer_id);
CREATE INDEX customer_addresses_postcode_idx     ON customer_addresses(postcode);
CREATE INDEX customer_addresses_deleted_at_idx   ON customer_addresses(deleted_at);



CREATE TABLE wishlists (
    id          NVARCHAR(36)  NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    customer_id NVARCHAR(36)  NOT NULL,
    name        NVARCHAR(255) NOT NULL DEFAULT 'My Wishlist',
    visibility  NVARCHAR(10)  NOT NULL DEFAULT 'PRIVATE',
    deleted_at  DATETIME2,
    created_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    updated_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT wishlists_pk              PRIMARY KEY (id),
    CONSTRAINT wishlists_visibility_ck   CHECK (visibility IN ('PRIVATE', 'PUBLIC')),
    CONSTRAINT wishlists_customer_fk     FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX wishlists_customer_id_idx ON wishlists(customer_id);
CREATE INDEX wishlists_deleted_at_idx  ON wishlists(deleted_at);

-- =============================================

CREATE TABLE wishlist_items (
    id          NVARCHAR(36)  NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    wishlist_id NVARCHAR(36)  NOT NULL,
    product_id  NVARCHAR(36)  NOT NULL,
    notes       NVARCHAR(MAX),
    created_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT wishlist_items_pk          PRIMARY KEY (id),
    CONSTRAINT wishlist_items_wishlist_fk FOREIGN KEY (wishlist_id)
        REFERENCES wishlists(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX wishlist_items_wishlist_product_key ON wishlist_items(wishlist_id, product_id);
CREATE INDEX wishlist_items_wishlist_id_idx             ON wishlist_items(wishlist_id);
CREATE INDEX wishlist_items_product_id_idx              ON wishlist_items(product_id);

-- =============================================

CREATE TABLE reviews (
    id          NVARCHAR(36)  NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    customer_id NVARCHAR(36)  NOT NULL,
    product_id  NVARCHAR(36)  NOT NULL,
    order_id    NVARCHAR(36),
    rating      SMALLINT      NOT NULL,
    title       NVARCHAR(255),
    body        NVARCHAR(MAX) NOT NULL,
    images      NVARCHAR(MAX) NOT NULL DEFAULT '',
    status      NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    deleted_at  DATETIME2,
    created_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    updated_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT reviews_pk          PRIMARY KEY (id),
    CONSTRAINT reviews_status_ck   CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT reviews_rating_ck   CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT reviews_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX reviews_customer_product_key ON reviews(customer_id, product_id);
CREATE INDEX reviews_product_id_idx              ON reviews(product_id);
CREATE INDEX reviews_status_idx                  ON reviews(status);
CREATE INDEX reviews_deleted_at_idx              ON reviews(deleted_at);

-- =============================================

CREATE TABLE support_tickets (
    id          NVARCHAR(36)  NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    customer_id NVARCHAR(36)  NOT NULL,
    agent_id    NVARCHAR(36),
    ticket_ref  NVARCHAR(100) NOT NULL,
    subject     NVARCHAR(500) NOT NULL,
    category    NVARCHAR(20)  NOT NULL DEFAULT 'GENERAL',
    priority    NVARCHAR(10)  NOT NULL DEFAULT 'MEDIUM',
    status      NVARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    order_id    NVARCHAR(36),
    metadata    NVARCHAR(MAX),
    resolved_at DATETIME2,
    deleted_at  DATETIME2,
    created_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    updated_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT support_tickets_pk          PRIMARY KEY (id),
    CONSTRAINT support_tickets_category_ck CHECK (category IN ('ORDER','DELIVERY','PRODUCT','APPOINTMENT','PAYMENT','REFUND','GENERAL','OTHER')),
    CONSTRAINT support_tickets_priority_ck CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
    CONSTRAINT support_tickets_status_ck   CHECK (status IN ('OPEN','IN_PROGRESS','WAITING_ON_CUSTOMER','RESOLVED','CLOSED')),
    CONSTRAINT support_tickets_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX support_tickets_ticket_ref_key ON support_tickets(ticket_ref);
CREATE INDEX support_tickets_customer_id_idx       ON support_tickets(customer_id);
CREATE INDEX support_tickets_status_idx            ON support_tickets(status);
CREATE INDEX support_tickets_priority_idx          ON support_tickets(priority);
CREATE INDEX support_tickets_category_idx          ON support_tickets(category);
CREATE INDEX support_tickets_agent_id_idx          ON support_tickets(agent_id);
CREATE INDEX support_tickets_deleted_at_idx        ON support_tickets(deleted_at);
CREATE INDEX support_tickets_created_at_idx        ON support_tickets(created_at DESC);

-- =============================================

CREATE TABLE support_messages (
    id          NVARCHAR(36)  NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    ticket_id   NVARCHAR(36)  NOT NULL,
    sender      NVARCHAR(10)  NOT NULL,
    sender_id   NVARCHAR(36)  NOT NULL,
    body        NVARCHAR(MAX) NOT NULL,
    attachments NVARCHAR(MAX) NOT NULL DEFAULT '',
    is_internal BIT           NOT NULL DEFAULT 0,
    created_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT support_messages_pk        PRIMARY KEY (id),
    CONSTRAINT support_messages_sender_ck CHECK (sender IN ('CUSTOMER','AGENT','SYSTEM')),
    CONSTRAINT support_messages_ticket_fk FOREIGN KEY (ticket_id)
        REFERENCES support_tickets(id) ON DELETE CASCADE
);

CREATE INDEX support_messages_ticket_id_idx  ON support_messages(ticket_id);
CREATE INDEX support_messages_sender_id_idx  ON support_messages(sender_id);
CREATE INDEX support_messages_created_at_idx ON support_messages(created_at ASC);

-- =============================================

CREATE TABLE loyalty_accounts (
    id              NVARCHAR(36) NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    customer_id     NVARCHAR(36) NOT NULL,
    points_balance  INT          NOT NULL DEFAULT 0,
    points_earned   INT          NOT NULL DEFAULT 0,
    points_redeemed INT          NOT NULL DEFAULT 0,
    tier            NVARCHAR(20) NOT NULL DEFAULT 'BRONZE',
    created_at      DATETIME2    NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2    NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT loyalty_accounts_pk          PRIMARY KEY (id),
    CONSTRAINT loyalty_accounts_balance_ck  CHECK (points_balance >= 0),
    CONSTRAINT loyalty_accounts_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX loyalty_accounts_customer_id_key ON loyalty_accounts(customer_id);

-- =============================================

CREATE TABLE loyalty_transactions (
    id          NVARCHAR(36)  NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    account_id  NVARCHAR(36)  NOT NULL,
    type        NVARCHAR(10)  NOT NULL,
    points      INT           NOT NULL,
    description NVARCHAR(500) NOT NULL,
    reference   NVARCHAR(255),
    expires_at  DATETIME2,
    created_at  DATETIME2     NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT loyalty_transactions_pk         PRIMARY KEY (id),
    CONSTRAINT loyalty_transactions_type_ck    CHECK (type IN ('EARN','REDEEM','EXPIRE','ADJUST')),
    CONSTRAINT loyalty_transactions_account_fk FOREIGN KEY (account_id)
        REFERENCES loyalty_accounts(id) ON DELETE CASCADE
);

CREATE INDEX loyalty_transactions_account_id_idx ON loyalty_transactions(account_id);
CREATE INDEX loyalty_transactions_type_idx        ON loyalty_transactions(type);
CREATE INDEX loyalty_transactions_expires_at_idx  ON loyalty_transactions(expires_at);
CREATE INDEX loyalty_transactions_created_at_idx  ON loyalty_transactions(created_at DESC);

-- =============================================

CREATE TABLE referrals (
    id               NVARCHAR(36)  NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    referrer_id      NVARCHAR(36)  NOT NULL,
    referred_id      NVARCHAR(36),
    referral_code    NVARCHAR(100) NOT NULL,
    status           NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    reward_issued_at DATETIME2,
    created_at       DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2     NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT referrals_pk          PRIMARY KEY (id),
    CONSTRAINT referrals_referrer_fk FOREIGN KEY (referrer_id)
        REFERENCES customers(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX referrals_referral_code_key ON referrals(referral_code);
CREATE INDEX referrals_referrer_id_idx          ON referrals(referrer_id);
CREATE INDEX referrals_referred_id_idx          ON referrals(referred_id);
CREATE INDEX referrals_status_idx               ON referrals(status);

-- =============================================

CREATE TABLE notification_preferences (
    id               NVARCHAR(36) NOT NULL DEFAULT CONVERT(NVARCHAR(36), NEWID()),
    customer_id      NVARCHAR(36) NOT NULL,
    email_order      BIT          NOT NULL DEFAULT 1,
    email_marketing  BIT          NOT NULL DEFAULT 0,
    email_newsletter BIT          NOT NULL DEFAULT 0,
    email_review     BIT          NOT NULL DEFAULT 1,
    sms_order        BIT          NOT NULL DEFAULT 0,
    sms_marketing    BIT          NOT NULL DEFAULT 0,
    push_order       BIT          NOT NULL DEFAULT 0,
    push_marketing   BIT          NOT NULL DEFAULT 0,
    created_at       DATETIME2    NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2    NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT notification_preferences_pk          PRIMARY KEY (id),
    CONSTRAINT notification_preferences_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX notification_preferences_customer_id_key ON notification_preferences(customer_id);