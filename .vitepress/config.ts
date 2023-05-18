import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kitty Toolchain",
  description: "Docs",
  base: "/kitty-toolchain.github.io",
  outDir: "docs/.vitepress/dist",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: "Home", link: "/" }],

    sidebar: [
      {
        text: "Core",
        items: [{ text: "Dodec declarations", link: "/godot/about-dodec" }],
      },
      {
        text: "Built-in DContexts",
        items: [
          { text: "Activator", link: "/godot/builtin-contexts/activator" },
          { text: "Area", link: "/godot/builtin-contexts/area" },
          {
            text: "AttackSpeed",
            link: "/godot/builtin-contexts/attack-speed",
          },
          { text: "Charges", link: "/godot/builtin-contexts/charges" },
          { text: "Cooldown", link: "/godot/builtin-contexts/cooldown" },
          {
            text: "DamageDealer",
            link: "/godot/builtin-contexts/damage-dealer",
          },
          {
            text: "ProjectileSpawner",
            link: "/godot/builtin-contexts/projectile-spawner",
          },
          { text: "RemoteArea", link: "/godot/builtin-contexts/remote-area" },
          {
            text: "TargetStore",
            link: "/godot/builtin-contexts/target-store",
          },
        ],
      },
    ],

    socialLinks: [],
  },
});
