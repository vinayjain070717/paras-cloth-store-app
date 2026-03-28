export function getWhatsAppLink(
  phone: string,
  message: string
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

export function buildOrderMessage(product: {
  name: string;
  code: string;
  price: number;
  color?: string;
}): string {
  let msg = `Hi, I'm interested in *${product.name}*\nCode: ${product.code}\nPrice: ₹${product.price.toLocaleString("en-IN")}`;
  if (product.color) {
    msg += `\nColor: ${product.color}`;
  }
  msg += `\n\nIs it available?`;
  return msg;
}

export function buildCatalogMessage(
  shopName: string,
  products: Array<{
    name: string;
    code: string;
    price: number;
    colors?: string[];
    stock_count?: number | null;
  }>,
  baseUrl: string
): string {
  let msg = `*${shopName}*\n${"─".repeat(30)}\n\n`;

  products.forEach((p, i) => {
    msg += `${i + 1}. *${p.name}*\n`;
    msg += `   Code: ${p.code}\n`;
    msg += `   Price: ₹${p.price.toLocaleString("en-IN")}\n`;
    if (p.colors && p.colors.length > 0) {
      msg += `   Colors: ${p.colors.join(", ")}\n`;
    }
    if (p.stock_count) {
      msg += `   Stock: ${p.stock_count} left\n`;
    }
    msg += `   View: ${baseUrl}/product/${p.code}\n\n`;
  });

  msg += `${"─".repeat(30)}\n`;
  msg += `Total items: ${products.length}\n`;
  msg += `Browse all: ${baseUrl}\n\n`;
  msg += `Reply to order or call us!`;

  return msg;
}
