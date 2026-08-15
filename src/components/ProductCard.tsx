import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    isNew?: boolean;
    colors?: string[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`} className="product-card animate-fade-in-up">
      <div className="product-card-image">
        {product.isNew && <span className="product-card-badge">جديد</span>}
        <img src={product.image} alt={product.name} />
        {product.colors && product.colors.length > 0 && (
          <div className="product-card-colors">
            {product.colors.map((color, idx) => (
              <span 
                key={idx} 
                className="product-card-color-dot"
                style={{ backgroundColor: color }}
              ></span>
            ))}
          </div>
        )}
      </div>
      <div className="product-card-info">
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-price">{product.price} د.أ</p>
      </div>
    </Link>
  );
}
