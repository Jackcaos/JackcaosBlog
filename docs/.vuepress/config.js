const path = require('path')

module.exports = {
    title: 'Jackcaos’s Blog',
    description: 'Do one thing at a time, and do well',
    head: [
        ['link', { rel: 'icon', href: '/favicon.ico' }], // 增加一个自定义的 favicon(网页标签的图标)
    ],
    base: '/JackcaosBlog/',
    markdown: {
    lineNumbers: true // 代码块显示行号
    },
    themeConfig: {
        // sidebarDepth: 0, // e'b将同时提取markdown中h2 和 h3 标题，显示在侧边栏上。
        sidebar: {
          '/web-front/': [
            {
              title: '函数式编程',
              collapsable: true,
              children: ['functional']
            },
            'home2'
          ],
          '/react/': [
            {
              title: '搭建Typescript+React环境',
              collapsable: true,
              children: ['tsreact']
            },
            {
              title: 'redux的原理解析',
              collapsable: true,
              children: ['redux']
            }
          ]
        },
        lastUpdated: 'Last Updated', // 文档更新时间：每个文件git最后提交的时间
        nav:[
            { text: '前端基础', link: '/web-front/functional' }, // 内部链接 以docs为根目录
            { text: 'React', link: '/react/tsreact' }, // 外部链接
            { text: 'Vue', link: '/vue' },
            { text: '工程化', link: '/engineering'},
            { text: 'Node', link: '/node'},
            { text: '算法', link: '/algorithm'},
            // 下拉列表
            {
              text: 'GitHub',
              items: [
                { text: 'GitHub地址', link: 'https://github.com/Jackcaos' },
              ]
            }        
          ],
          configureWebpack: {
            resolve: {
              alias: {
                '@images': path.join(__dirname, '/images'),
              }
            }
          }
    }
}