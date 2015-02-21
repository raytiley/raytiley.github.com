---
layout: default
title:  "Fun With Components"
date:   2015-02-21 2:25:00 PM
categories: emberjs components helpers
---

# Fun With Components

It is a week before I head off the EmberConf and I'm sitting in a bar thinking it is about time I start sharing some of the knowledge I steal from the very friendly folks in #emberjs. The past few weeks I've spent working on redoing our scheduling interface, porting some ASP.NET webforms to ember. During this process I've run into multiple situations where I need to make a choice about what `component` to render.

Before [PR 10093](https://github.com/emberjs/ember.js/pull/10093) I would have likely done this with some pretty ugly, but totally functional `if` helpers like so.

{% highlight handlebars %}
{% raw %}
{{#each item in schedule}}
  {{#if item.isRun}}
    {{run-schedule-item item=item}}
  {{/if}}

  {{#if item.isGap}}
    {{gap-schedule-item item=item}}
  {{/if}}

  {{#if item.isManualEvent}}
    {{manual-event-schedule-item item=item}}
  {{/if}}
{{/each}}
{% endraw %}
{% endhighlight %}

Here are my top complaints with this approach.

- The thing we are rendering have a property that dictates how it is displayed. Sounds like some pretty tight coupling.

- It is fairly verbose. With only three choices it is managable now, but what if we had ten choices, or a hundred? This template could get overwhelming fast.

- My choices are limited. Because the component I am rendering is hard coded into the template, this approache only works well if there is one factor that decides what comonnent to pick. If the choice is more complicated the code quickly becomes unbearable. 

One of the "requirements" for the re-write of our schedule is that it responsive. Our current product is pretty much unusable on a mobile device, and if we are redoing it, might as well fix that in the process. I am sure there are CSS wizards that could make our schedule amazing with media queries alone. I am not that person, it is just too damn hard. I am writing a JavaScript application, why do I need to limit myself to CSS to make something work on mobile.

Further the interactions I want to provice to my users change when on a mobile device. Simply making columns colapse and hiding some elements using CSS isn't going to cut it. I actually want to render a different component, with different behaviors depending on what screen size is used. Borrowing a phrase from my github crush @rwjblue, "the last part is the sticky wicket".

Here is some incomprehensible code that might work.

{% highlight handlebars %}
{% raw %}
{{#each item in schedule}}
  {{#if media.isSm}}
	  {{#if item.isRun}}
	    {{run-schedule-item-sm item=item}}
	  {{/if}}

	  {{#if item.isGap}}
	    {{gap-schedule-item-sm item=item}}
	  {{/if}}

	  {{#if item.isManualEvent}}
	    {{manual-event-schedule-item-sm item=item}}
	  {{/if}}
  {{/if}}

  {{#if media.isMd}}
	  {{#if item.isRun}}
	    {{run-schedule-item-md item=item}}
	  {{/if}}

	  {{#if item.isGap}}
	    {{gap-schedule-item-md item=item}}
	  {{/if}}

	  {{#if item.isManualEvent}}
	    {{manual-event-schedule-item-md item=item}}
	  {{/if}}
  {{/if}}

  {{#if media.isLg}}
	  {{#if item.isRun}}
	    {{run-schedule-item-lg item=item}}
	  {{/if}}

	  {{#if item.isGap}}
	    {{gap-schedule-item-lg item=item}}
	  {{/if}}

	  {{#if item.isManualEvent}}
	    {{manual-event-schedule-item-lg item=item}}
	  {{/if}}
  {{/if}}

{{/each}}
{% endraw %}
{% endhighlight %}

The above code is ridiculous. I have three breakpoints, and three different items that I **might** need to render differently. If the types of items in my list grows or god forbid I add another break point the template gets even more messy. 

Enter the `component` helper that is currently in beta or canary (ask @rwblue). The basic gist is that you can pass a property that will be the name of the component your going to render. It sounds simple, but is crazy powerful. It simplifies our fist code example to the following.

{% highlight handlebars %}
{% raw %}
{{#each item in schedule}}
  {{component item.component item=item}}
{{/each}}
{% endraw %}
{% endhighlight %}

There are still some problems here. The component being rendered is still determined by the item itself, we'll break this coupling soon. Still it is a lot cleaner. Our responsive example can benfit too, but is still pretty tightly coupled.

{% highlight handlebars %}
{% raw %}
{{#each item in schedule}}
  {{#if media.isSm}}
    {{component item.smComponent item=item}}
  {{/if}}

  {{#if media.isMd}}
    {{component item.mdComponent item=item}}
  {{/if}}

  {{#if media.isLg}}
    {{component item.lgComponent item=item}}
  {{/if}}
{{/each}}
{% endraw %}
{% endhighlight %}

Now I *could* inject `media` into my models and make the `component` property on `item` a computed property that would return the appropriate responsive helper depending on the current breakpoint size. But there is only so much I'm willing to do in the name of making my handlebars (HTMLbars?) templates cleaner. 

What I really wanted to do is break the coupling between my models and what component rendered them. My initial idea was to make a helper, like the `component` helper, that could take my crazy responsive ideas and pick the best component available to render. So I screamed at twitter...

<blockquote class="twitter-tweet" lang="en"><p>Can anyone give me a gist on how to render a component from a helper using public apis? Currently on canary. <a href="https://twitter.com/hashtag/emberjs?src=hash">#emberjs</a></p>&mdash; raytiley (@raytiley) <a href="https://twitter.com/raytiley/status/568415648428244992">February 19, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

However no one answered my call. After enough wining in IRC @rwjblue (did I mention I have a github crush on him) answered my call. Here is a jsbin of what he came up with.

<a class="jsbin-embed" href="http://emberjs.jsbin.com/rwjblue/323/embed?output">JS Bin</a><script src="http://static.jsbin.com/js/embed.js"></script>

It was an awesome steps, but it wasn't perfect for my needs. The `params` passed into the helper aren't bound, and suposidly binding them makes it much more complicated. This means I can't pass in the current breakpoint and have the componenet change if the user resizes the browser. A less important, but still relevant concern is that I don't really *get* what is going on. It is using APIs that I could understand if I read the source, but aren't documented and may change on some aspiring core contributers whim (@mixonic). But it lit a spark, and here is what I came up with.

<a class="jsbin-embed" href="http://emberjs.jsbin.com/yetida/2/embed?output">JS Bin</a><script src="http://static.jsbin.com/js/embed.js"></script>

So what is this magic? Well the main difference is that the helper is bound, and it is determined by a subexpression. This is actually the first legit use for supexpressions that I've had outside of query params. If you haven't used a subexpression before the idea is pretty simple. It is a way to call a helper as a paramter to another helper. Its very functional and lispy, but it allows me to isolate what component gets rendered to a single helper that is easily testable.

It allows for the complicated responsive example to become

{% highlight handlebars %}
{% raw %}
{{#each item in schedule}}
    {{component (responsive-helper item.component media.currentBreakpoint) item=item}}
{{/each}}
{% endraw %}
{% endhighlight %}

The astute observer will notice that I'm still pretty tightly coupled, but that could be reworked (did I mention I am at a bar?). The important bit is that the choice of component is isolated to my `responsive-helper` and everything is all magically bound, which is the way it should be.

So what other magic is the `component` helper good for? Personally I'm using it to make component choices for an advanced search builder and dynamic compoents (seen above). I imagine my use of the `component` helper to keep increasing, it is just that awesome. 

If anyone sees me at EmberConf remind me to buy @lukemelia a beer for getting the `component` helper into core. 

This is my first attempt at writing a blog post, let alone a technical one. If I screwed up royally please let me know on twitter @raytiley and I'll try to correct ASAP. Hopefully there is more to come. I'm doing a lot of Ember lately and really digging it.
