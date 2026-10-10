function nameTokens(name) {
  return [...new Set(String(name).normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])];
}

function replaceNameTokens(database, productId, name) {
  database.run('DELETE FROM product_search_tokens WHERE product_id = ?', [productId]);
  for (const token of nameTokens(name)) {
    database.run('INSERT INTO product_search_tokens (product_id, token) VALUES (?, ?)',
      [productId, token]);
  }
}

module.exports = { nameTokens, replaceNameTokens };
