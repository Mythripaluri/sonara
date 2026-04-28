import Head from "expo-router/head";

type SeoProps = {
  title: string;
  description: string;
};

const siteName = "Sonara";

export default function Seo({ title, description }: SeoProps) {
  const fullTitle = title === siteName ? title : `${title} · ${siteName}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="application-name" content={siteName} />
      <meta name="robots" content="index,follow" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="theme-color" content="#121212" />
    </Head>
  );
}