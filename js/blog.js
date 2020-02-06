window.blogs = fetch('/get-blog-entries')
    .then(res => res.text())
    .then(body => JSON.parse(body))

function loadBlogs(b) {
    inject('')
    b.forEach((blog, i) => {
        inject(`<div class="jumbotron">
            ${i === 0 ? '<br><br><br>' : ''}
            <h3>${blog.title}</h3>
            <p class="text-muted">${blog.sticky ? '<i class="fas fa-thumbtack"></i>   ' : ''}${new Date(blog.date).toDateString()}</p>
            ${blog.body}
            ${blog.authors && blog.authors.length > 0 ? `<p class="text-muted">Written by ${blog.authors.join(', ')}</p>` : ''}
            ${blog.editors && blog.editors.length > 0 ? `<p class="text-muted">Edited by ${blog.editors.join(', ')}</p>` : ''}
        </div>`, false)
    })
}

/**
 * BlogEntry: {
 *   title: string,
 *   body: markdown | html,
 *   date: number,
 *   sticky: boolean,
 *   authors: string[],
 *   editors: string[]
 * }
 */