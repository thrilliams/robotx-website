window.blogs = fetch('/get-blog-entries')
    .then(res => res.text())
    .then(body => JSON.parse(body))

/**
 * BlogEntry: {
 *   title: string,
 *   body: markdown | html,
 *   date: number,
 *   sticky: boolean
 * }
 */