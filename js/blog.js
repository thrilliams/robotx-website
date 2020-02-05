window.blogs = fetch('/get-blog-entries')
    .then(res => res.text())
    .then(body => JSON.parse(body))