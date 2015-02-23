---
layout: post
title:  "Using Subexpressions (Nested Helpers) in Ember.js"
date:   2015-02-21 2:30:00 PM
categories: emberjs components helpers subexpressions handlebars
---

If you haven't read my [last post](http://localhost:4000/posts/fun-with-components/) go read it now. The TL;DR; is that we are trying render a component dynamically based on what we are rendering, and the current browser width. The `component` helper got us most of the way there, but we are still relying on the model to have the name of the component to render.

My initial idea was to make own helper, like the `component` helper, that could take my crazy responsive ideas and pick the best component available to render. So I screamed at twitter...

<blockquote class="twitter-tweet" lang="en"><p>Can anyone give me a gist on how to render a component from a helper using public apis? Currently on canary. <a href="https://twitter.com/hashtag/emberjs?src=hash">#emberjs</a></p>&mdash; raytiley (@raytiley) <a href="https://twitter.com/raytiley/status/568415648428244992">February 19, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

However no one answered my call. After enough wining in IRC @rwjblue ([did I mention I have a github crush on him](/posts/fun-with-components)) answered my call. Here is a jsbin of what he came up with.

<a class="jsbin-embed" href="http://emberjs.jsbin.com/rwjblue/323/embed?output">JS Bin</a><script src="http://static.jsbin.com/js/embed.js"></script>

The special sauce is in the `ResponsiveComponentHelper`'s `helperFunction` method. It allows me to pass in a `baseName` that can then be used to find the appropriate helper. I could use it like this.

{% highlight handlebars %}
{% raw %}
{{#each item in schedule}}
  {{responsive-component item.type item=item}}
{{/each}}
{% endraw %}
{% endhighlight %}

In the above code `item.type` is `baseName` of the component, so if `type === run` it is going to try and find `run-sm`, `run-med` etc. This is just an example @rwjblue gave me and I didn't motify it to actually determine the current breakpoints etc.

It was an awesome first step, but it wasn't perfect for my needs. The `params` passed into the helper aren't bound, and supposedly binding them makes it much more complicated. This means I can't pass in the current breakpoint and have the componenet change if the user resizes the browser. A less important, but still relevant concern is that I don't really *get* what is going on. It is using APIs that I could understand if I read the source, but aren't documented and may change on some aspiring core contributers whim (@mixonic). But it lit a spark, and here is what I came up with.

<a class="jsbin-embed" href="http://emberjs.jsbin.com/yetida/2/embed?output">JS Bin</a><script src="http://static.jsbin.com/js/embed.js"></script>

So what is this magic? First I am back to using the good old `component` helper. However the component name I'm passing in is determined using a handlebars subexpression. This is actually the first legit use for supexpressions that I've had outside of query params. If you haven't used a subexpression before the idea is pretty simple. It is a way to call a helper as a paramter to another helper. Its very functional and lispy, but it allows me to isolate what component gets rendered to a single helper that is easily testable.

It allows for the complicated responsive example to become

{% highlight handlebars %}
{% raw %}
{{#each item in schedule}}
    {{component (responsive-helper item.component media.currentBreakpoint) item=item}}
{{/each}}
{% endraw %}
{% endhighlight %}

The astute observer will notice that I'm still pretty tightly coupled, but that could be reworked (did I mention I am at a bar?). The important bit is that the choice of component is isolated to my `responsive-helper` and everything is all magically bound, which is the way it should be.

To recap, a subexpression is just a nested helper. It allows you to replace a parameter to a helper with a value calculated by a second helper. For a good example of where subexpressions (nested helpers) can be used to great affect checkout [ember-truth-helpers](https://www.npmjs.com/package/ember-truth-helpers). In our case we are using a custom heler to calculate a component name which we then pass to the `component` helper.

So what other magic can subexpressions and the component helper be used for? Personally I’m using it to make component choices for an advanced search builder and choosing components based on screen size (seen above). I see myself using this pattern a lot in the future, it's just that awesome.