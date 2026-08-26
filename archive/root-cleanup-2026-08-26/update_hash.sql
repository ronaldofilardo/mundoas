UPDATE usuarios SET senha_hash = '$2a$10$2calrbHebt9dZV0FxmA3xe/3jBvA2zvanQ9I8rwecwcjT5Iu7RxU.', senha_temporaria = false, atualizado_em = NOW() WHERE email IN ('taninha@asa.com', 'teste@asa.com');
