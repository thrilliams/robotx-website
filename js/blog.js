window.blogs = fetch('/get-blogs')
    .then(res => res.json())

function loadBlogs(b) {
    inject('')
    b.forEach((blog, i) => {
        let html = `<div class="jumbotron">
            ${i === 0 ? '<br><br><br>' : ''}
            <h3>${blog.title}</h3>
            <p class="text-muted">${blog.sticky ? '<i class="fas fa-thumbtack"></i>\t' : ''}${new Date(blog.date).toDateString()}</p>
            ${blog.body}
            ${blog.authors && blog.authors.length > 0 ? `<p class="text-muted">Written by ${blog.authors.join(', ')}</p>` : ''}
            ${blog.editors && blog.editors.length > 0 ? `<p class="text-muted">Edited by ${blog.editors.join(', ')}</p>` : ''}
        </div>`;
        html = $(html);
        console.log(html.find('img'));
        html.find('img').addClass('img-fluid');
        html.find('img').css('border-radius', '5px');
        inject(html, false);
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