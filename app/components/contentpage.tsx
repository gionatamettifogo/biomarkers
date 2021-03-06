//
// contentpage.tsx - a content detail page used for topics, blogs, biomarkers
//

import React from "react"
import Box from "@mui/material/Box"
import List from "@mui/material/List"

import { AppLayout } from "./layouts"
import { Content } from "../lib/items/contents"
import { Biomarker } from "../lib/items/biomarkers"
import { Section } from "./section"
import { BiomarkerListItem, ArticleListItem, ReferenceListItem } from "./listitems"

interface ContentPageProps {
  /** Item that should be shown */
  item: Content

  /** Content or components shown at the top of the page */
  header?: any
}

/** Shows a gallery of images with titles and optional subtitles arranged in tiles of variables sizes */
export function ContentPage({ item, header }: ContentPageProps) {
  const contentHtml = item.contentHtml ? item.contentHtml : "empty"
  const biomarkers = item.biomarkers as any as Biomarker[]
  const articles = item.articles as any as Content[]

  return (
    <AppLayout title={item.title} description={item.description} showBack={true}>
      {header}
      <article id={item.id} title={item.title}>
        {contentHtml && (
          <Box mb={4}>
            <section>
              <div className="markdown" dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </section>
          </Box>
        )}
        {biomarkers && (
          <Section title="Biomarkers">
            <List>
              {biomarkers.map((biomarker) => (
                <BiomarkerListItem key={biomarker.id} item={biomarker} />
              ))}
            </List>
          </Section>
        )}
        {articles && (
          <Section title="Articles">
            <List>
              {articles.map((article) => (
                <ArticleListItem key={article.id} item={article} />
              ))}
            </List>
          </Section>
        )}
        {item.references && (
          <Section title="References">
            <List>
              {item.references.map((ref: Content) => (
                <ReferenceListItem key={ref.id || ref.url} item={ref} />
              ))}
            </List>
          </Section>
        )}
      </article>
    </AppLayout>
  )
}
