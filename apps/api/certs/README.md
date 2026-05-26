# TLS — AWS RDS / Aurora

`aws-rds-global-bundle.pem`, AWS’un yayınladığı kök CA paketidir ([global bundle](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html)). `buildPgPoolConfig` (`@leanmgmt/shared-utils`) RDS hostname’i algıladığında bu dosyayı kullanarak sunucu sertifikasını doğrular; **API ve worker** aynı CA mantığını paylaşır (worker `cwd` farklı olsa da monorepo yolundan bu dosya aranır).

Özel CA yolu için ortam değişkeni: `DATABASE_SSL_CA` (mutlak veya ilgili uygulamanın `process.cwd()` köküne göre yol).
