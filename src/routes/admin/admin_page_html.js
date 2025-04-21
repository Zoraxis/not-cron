export const admin_page_html = (content) =>
  `
        <html>
  <head>
    <title>Notto Admin</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <script src="https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js"></script>
  </head>

  <body
    class="bg-black m-0 min-h-[100vh] w-screen max-w-[100vw] overflow-hidden"
  >
    <div class="absolute right-12 top-12">
        <div id="ton-connect"></div>
    </div>
    <div class="w-screen h-screen flex flex-col items-center justify-center">
      ${content}
    </div>

    <script>
      const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: "https://notto.io/tonconnect-manifest.json",
        buttonRootId: "ton-connect",
      });
    </script>
  </body>
</html>
`;
