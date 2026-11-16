import { PostList } from "@/components/post-list"
import { getPostIndex } from "@/lib/posts"
import { site } from "@/lib/site"

export default async function HomePage() {
  const posts = await getPostIndex()

  return (
    <main className="pt-8">
      <div className="monogram" role="img" aria-label={site.nameZh}>
        柯
      </div>
      <p className="mt-5 leading-8">
        {site.links.map((link, index) => (
          <span key={link.href}>
            {index > 0 ? " / " : null}
            <a
              href={link.href}
              className="underline decoration-dashed underline-offset-8 hover:decoration-solid"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          </span>
        ))}
      </p>
      <p className="mt-3">{site.role}</p>
      <p className="mt-3">{site.bio}</p>
      <hr className="mt-8 border-0 border-t border-skin-line" />
      <PostList posts={posts} />
    </main>
  )
}
