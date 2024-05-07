```twig

{% include '/components/__lmnzr/images/images.twig' with {
    path: '',
    src: 'cover-ot',
    ext: 'jpeg',
    webp: true,
    width: 2400,
    height: 1600,
    class: 'img-fluid',
    attributes: 'data-bs-target="#target"',
    sources: [
        { bpt: 'sm', suffix: 'mobile', w: [ 600, 1100 ], width: 1100, height: 1550 },
        { bpt: '', suffix: '', w: [ 1200, 1800, 2400 ], width: '', height: '' },
    ]
} %}

```
