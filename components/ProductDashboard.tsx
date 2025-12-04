"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ProductType = {
  _id: string | { toString: () => string };
  title: string;
  price: number;
  images?: string[];
  categoryId?: string | { toString: () => string };
  createdAt?: string | Date;
  isCustomOrder?: boolean;
};

type CategoryType = {
  _id: string;
  name: string;
};

interface ProductDashboardProps {
  products: ProductType[];
  categories?: CategoryType[]; 
  initialCategoryId?: string; 
  itemsPerPage?: number;
}

export default function ProductDashboard({
  products = [],
  categories,
  initialCategoryId = "all",
  itemsPerPage = 12,
}: ProductDashboardProps) {
  const normalizeId = (id: any) => (id && typeof id === "object" ? id.toString() : String(id ?? ""));

  const derivedCategories: CategoryType[] = useMemo(() => {
    if (categories && categories.length > 0) return categories;
    const map = new Map<string, string>();
    products.forEach((p) => {
      const cid = normalizeId(p.categoryId) || "uncategorized";
      if (!map.has(cid)) {
        map.set(cid, cid === "uncategorized" ? "Uncategorized" : cid);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ _id: id, name }));
  }, [categories, products]);

  const [activeCategory, setActiveCategory] = useState<string>(initialCategoryId);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc">("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let list = products.filter((p) => {
      if (activeCategory !== "all") {
        const pid = normalizeId(p.categoryId);
        if (pid !== activeCategory) return false;
      }
      if (normalizedQuery) {
        return String(p.title || "").toLowerCase().includes(normalizedQuery);
      }
      return true;
    });

    list = list.sort((a, b) => {
      if (sort === "price-asc") return (a.price ?? 0) - (b.price ?? 0);
      if (sort === "price-desc") return (b.price ?? 0) - (a.price ?? 0);
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    return list;
  }, [products, activeCategory, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page, itemsPerPage]);

  const formatPrice = (v?: number) =>
    v === undefined || v === null ? "-" : `$${Number(v).toFixed(2)}`;

  const handleCategoryClick = (id: string) => {
    setActiveCategory(id);
    setPage(1);
  };

  return (
    <section className="w-full">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => handleCategoryClick("all")}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              activeCategory === "all"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
            aria-pressed={activeCategory === "all"}
          >
            All
          </button>

          {derivedCategories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategoryClick(cat._id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                activeCategory === cat._id
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              aria-pressed={activeCategory === cat._id}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <label className="relative">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search products..."
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400 w-48 md:w-64"
              aria-label="Search products"
            />
          </label>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-gray-200"
            aria-label="Sort products"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {paginated.map((product) => {
          const id = normalizeId(product._id);
          const imgSrc = product.images && product.images.length > 0 ? product.images[0] : "/images/placeholder.jpg";

          return (
            <article
              key={id}
              tabIndex={0}
              className="relative group rounded-lg overflow-hidden shadow-sm bg-white focus-within:ring-2 focus-within:ring-sky-400"
            >
              <div className="w-full h-56 relative bg-gray-100">
                <Image
                  src={imgSrc}
                  alt={product.title || "Product image"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{product.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{formatPrice(product.price)}</p>

                <div className="mt-2 flex items-center gap-2">
                  {product.isCustomOrder && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                      Custom order
                    </span>
                  )}
                </div>
              </div>

              <div
                className="absolute inset-0 flex flex-col justify-end p-4 bg-black/0 group-hover:bg-black/40 focus-within:bg-black/40 transition"
                aria-hidden
              >
                <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                  <h4 className="text-white text-lg font-semibold">{product.title}</h4>
                  <p className="text-white mt-1">{formatPrice(product.price)}</p>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/products/${id}`}
                      className="inline-block bg-white text-black px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100"
                    >
                      More Info
                    </Link>

                    <Link
                      href={`/cart/add?product=${id}`}
                      className="inline-block bg-sky-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-sky-700"
                    >
                      Add to Cart
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-3 py-1 rounded border disabled:opacity-40"
        >
          Prev
        </button>

        <div className="px-3 py-1 rounded border">
          Page {page} / {totalPages}
        </div>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded border disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
