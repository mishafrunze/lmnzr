# Icons

This component allows to include icons from `./public/assets/icons/sprite.svg`, which is generated from all the icons from `./src/bundles/icons/` folder. You can put any svg icons you want, the only rule is to make them square. They all will be optimized while sprite generating.

The twig template generates `<span class="icon ratio ratio-1x1" aria-hidden="true">...</span>` with an svg icon inside.

## Usage

> Note: `aria-hidden="true"` is added by default.

### Required settings

```twig
{% include '/components/__lmnzr/icons/icons.twig' with { icon: 'icon-name' } only %}
```

Parameters:

- `icon`: name of the original icon file without `.svg` extention.

Output:

```html
<span class="icon ratio ratio-1x1" aria-hidden="true">
    <div>
        <svg class="icon__svg">
            <use xlink:href="/assets/icons/sprite.svg#icon-name"></use>
        </svg>
    </div>
</span>
```

### Optional settings

```twig
{% include '/components/__lmnzr/icons/icons.twig' with {
    icon: 'birthday',
    class: 'danger',
    attributes: 'data-attribute-name="attribute-value"' } only %}
```

Parameters:

- `class`: any additional classes
- `attributes`: any additional attributes

Output:

```html
<span class="icon additional-class other-additional-class" aria-hidden="true" data-toggle="menu">
  <svg class="icon__svg">
    <use xlink:href="./assets/img/icons/sprite.svg#icon-name"></use>
  </svg>
</span>
```
