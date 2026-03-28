/**
 * Inject Cloudinary transformation parameters into an existing Cloudinary CDN URL.
 * If the URL is not a Cloudinary URL, it is returned unchanged.
 *
 * Usage: store full Cloudinary URLs in the DB, call withTransform() when rendering
 * to get appropriately sized, auto-formatted images.
 */
export function withTransform(
  url: string,
  opts: { width?: number; height?: number; quality?: number } = {},
): string {
  if (!url || !url.includes("res.cloudinary.com")) return url;

  const transforms: string[] = ["c_fill", `q_${opts.quality ?? "auto"}`, "f_auto"];
  if (opts.width)  transforms.push(`w_${opts.width}`);
  if (opts.height) transforms.push(`h_${opts.height}`);

  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}
