addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch((error) => {
      const response = new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
      setCorsHeaders(response);
      return response;
    })
  );
});

function setCorsHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Admin-Password"
  );
}

function verifyAdminPassword(request) {
  const adminPassword = request.headers.get("X-Admin-Password");
  if (adminPassword !== ADMIN_PASSWORD) {
    const response = new Response("Unauthorized", { status: 401 });
    setCorsHeaders(response);
    return response;
  }
  return null; // Continue if password is correct
}

function isValidId(id) {
  return /^[a-zA-Z0-9]+$/.test(id);
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // 定义路由表
  const routes = {
    "POST:/send-cookies": handleSendCookies,
    "GET:/admin/list-cookies": handleListCookies,
    "POST:/admin/create": createData,
    "GET:/admin/read": readData,
    "PUT:/admin/update": updateData,
    "DELETE:/admin/delete": deleteData,
    "DELETE:/admin/delete-all": deleteAllData,
    "GET:/admin/list": listAllData,
    "GET:/admin": handleAdminPage, // 新增的路由
  };

  // 处理动态路由
  if (method === "GET" && path.startsWith("/receive-cookies/")) {
    return handleReceiveCookies(request, path);
  }

  const routeKey = `${method}:${path}`;
  const handler = routes[routeKey];

  if (handler) {
    return handler(request);
  }

  // 如果没有匹配的路由，返回404
  const response = new Response("Not Found", { status: 404 });
  setCorsHeaders(response);
  return response;
}

// 新增的处理函数
async function handleAdminPage(request) {
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="zh">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cookie 管理器</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: url('https://picsum.photos/1920/1080?blur=5') no-repeat center center fixed;
        background-size: cover;
        margin: 10px;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      .container {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        width: 90%;
        max-width: 800px;
      }
      h1, h2 {
        color: #0078D4;
      }
      input, textarea, button {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      button {
        background-color: #0078D4;
        color: white;
        border: none;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      button:hover {
        background-color: #005a9e;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 0.5rem;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Cookie 管理器</h1>
      
      <!-- 添加管理员密码输入和保存按钮 -->
      <div>
        <h2>管理员密码</h2>
        <input type="password" id="adminPassword" placeholder="输入管理员密码">
        <button id="savePassword">保存密码</button>
      </div>
      
      <!-- 创建 Cookie -->
      <div id="cookieManagement" style="display: none;">
        <h2>创建 Cookie</h2>
        <form id="createForm">
          <input type="text" id="createId" placeholder="ID" required>
          <input type="url" id="createUrl" placeholder="URL" required>
          <textarea id="createCookies" placeholder="Cookies (JSON 格式)" rows="3" required></textarea>
          <button type="submit">创建</button>
        </form>
      </div>
  
      <!-- 列出 Cookies -->
      <div id="cookieList" style="display: none;">
        <h2>已存储的 Cookies</h2>
        <button id="refreshList">刷新列表</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>URL</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="cookieList">
            <!-- 动态内容 -->
          </tbody>
        </table>
      </div>
  
      <!-- 更新 Cookie -->
      <div id="updateCookie" style="display: none;">
        <h2>更新 Cookie</h2>
        <form id="updateForm">
          <input type="text" id="updateId" placeholder="ID" required>
          <textarea id="updateCookies" placeholder="新的 Cookies (JSON 格式)" rows="3" required></textarea>
          <button type="submit">更新</button>
        </form>
      </div>
  
      <!-- 删除 Cookie -->
      <div id="deleteCookie" style="display: none;">
        <h2>删除 Cookie</h2>
        <form id="deleteForm">
          <input type="text" id="deleteId" placeholder="ID" required>
          <button type="submit">删除</button>
        </form>
      </div>
    </div>
  
    <script>
      const API_BASE = '';
      let adminPassword = '';
  
      document.addEventListener('DOMContentLoaded', () => {
        // 从本地存储中获取保存的密码
        adminPassword = localStorage.getItem('adminPassword') || '';
        if (adminPassword) {
          document.getElementById('adminPassword').value = adminPassword;
          showCookieManagement();
        }
  
        document.getElementById('savePassword').addEventListener('click', saveAdminPassword);
        document.getElementById('createForm').addEventListener('submit', createCookie);
        document.getElementById('updateForm').addEventListener('submit', updateCookie);
        document.getElementById('deleteForm').addEventListener('submit', deleteCookie);
        document.getElementById('refreshList').addEventListener('click', loadCookies);
      });
  
      function saveAdminPassword() {
        const password = document.getElementById('adminPassword').value;
        if (password) {
          localStorage.setItem('adminPassword', password);
          adminPassword = password;
          showCookieManagement();
          loadCookies();
          alert('管理员密码已保存');
        } else {
          alert('请输入有效的管理员密码');
        }
      }
  
      function showCookieManagement() {
        document.getElementById('cookieManagement').style.display = 'block';
        document.getElementById('cookieList').style.display = 'block';
        document.getElementById('updateCookie').style.display = 'block';
        document.getElementById('deleteCookie').style.display = 'block';
        loadCookies();
      }
  
      async function loadCookies() {
        const response = await fetch('/admin/list-cookies', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword
          }
        });
  
        if (response.ok) {
          const data = await response.json();
          const list = data.cookies;
          const tbody = document.getElementById('cookieList');
          tbody.innerHTML = '';
  
          list.forEach(cookie => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td>\${cookie.id}</td>
              <td>\${new URL(cookie.url).hostname}</td>
              <td>
                <button onclick="deleteCookieById('\${cookie.id}')">删除</button>
              </td>
            \`;
            tbody.appendChild(tr);
          });
        } else {
          alert('无法加载 Cookies 列表，请检查管理员密码是否正确');
        }
      }
  
      async function createCookie(event) {
        event.preventDefault();
        const id = document.getElementById('createId').value;
        const url = document.getElementById('createUrl').value;
        let cookies;
        try {
          cookies = JSON.parse(document.getElementById('createCookies').value);
        } catch {
          alert('Cookies 必须是有效的 JSON');
          return;
        }
  
        const response = await fetch('/admin/send-cookies', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword
          },
          body: JSON.stringify({ id, url, cookies })
        });
  
        const result = await response.json();
        alert(result.message);
        if (response.ok) {
          loadCookies();
          document.getElementById('createForm').reset();
        }
      }
  
      async function updateCookie(event) {
        event.preventDefault();
        const key = document.getElementById('updateId').value;
        let value;
        try {
          value = JSON.parse(document.getElementById('updateCookies').value);
        } catch {
          alert('Cookies 必须是有效的 JSON');
          return;
        }
  
        const response = await fetch('/admin/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
          body: JSON.stringify({ key, value })
        });
  
        const result = await response.json();
        alert(result.message);
        if (response.ok) {
          loadCookies();
          document.getElementById('updateForm').reset();
        }
      }
  
      async function deleteCookie(event) {
        event.preventDefault();
        const key = document.getElementById('deleteId').value;
  
        const response = await fetch('/admin/delete?key='+encodeURIComponent(key), {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json', 
            'X-Admin-Password': adminPassword 
          }
        });
  
        const result = await response.json();
        alert(result.message);
        if (response.ok) {
          loadCookies();
          document.getElementById('deleteForm').reset();
        }
      }
  
      async function deleteCookieById(id) {
        if (!confirm('确定要删除 ID 为'+id+' 的 Cookie 吗？')) return;
  
        const response = await fetch('/admin/delete?key='+encodeURIComponent(id), {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json', 
            'X-Admin-Password': adminPassword 
          }
        });
  
        const result = await response.json();
        alert(result.message);
        if (response.ok) {
          loadCookies();
        }
      }
    </script>
  </body>
  </html>
  `;
  const response = new Response(htmlContent, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
  setCorsHeaders(response);
  return response;
}

function handleCorsPreflightRequest() {
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(response);
  return response;
}

async function handleSendCookies(request) {
  const { id, url, cookies } = await request.json();

  if (!isValidId(id)) {
    const response = new Response(
      JSON.stringify({
        success: false,
        message: "Invalid ID. Only letters and numbers are allowed.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(response);
    return response;
  }

  // Check if the ID already exists
  const existing = await COOKIE_STORE.get(id);
  if (existing !== null) {
    const response = new Response(
      JSON.stringify({
        success: false,
        message: "Cookie ID already exists. Please use a unique ID.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(response);
    return response;
  }

  // Store the new cookies
  await COOKIE_STORE.put(id, JSON.stringify({ id, url, cookies }));

  const response = new Response(
    JSON.stringify({
      success: true,
      message: "Cookies received and stored successfully",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
  setCorsHeaders(response);
  return response;
}

async function handleReceiveCookies(request, path) {
  const id = path.split("/").pop();

  if (!isValidId(id)) {
    const response = new Response(
      JSON.stringify({
        success: false,
        message: "Invalid ID. Only letters and numbers are allowed.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(response);
    return response;
  }

  const storedData = await COOKIE_STORE.get(id);
  if (storedData === null) {
    const response = new Response(
      JSON.stringify({
        success: false,
        message: "No cookies found for the given ID: " + id,
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(response);
    return response;
  }

  const { cookies } = JSON.parse(storedData);

  const response = new Response(
    JSON.stringify({
      success: true,
      id,
      cookies: cookies,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
  setCorsHeaders(response);
  return response;
}

async function handleListCookies() {
  const list = await COOKIE_STORE.list();
  const cookies = [];

  for (const key of list.keys) {
    const value = await COOKIE_STORE.get(key.name);
    const { id, url } = JSON.parse(value);
    cookies.push({ id, url });
  }

  const response = new Response(
    JSON.stringify({
      success: true,
      cookies: cookies,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
  setCorsHeaders(response);
  return response;
}

async function createData(request) {
  const { key, value } = await request.json();

  if (!isValidId(key)) {
    const response = new Response(
      JSON.stringify({
        success: false,
        message: "Invalid key. Only letters and numbers are allowed.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(response);
    return response;
  }

  await COOKIE_STORE.put(key, JSON.stringify(value));
  const response = new Response(
    JSON.stringify({ success: true, message: "Data created successfully" }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
  setCorsHeaders(response);
  return response;
}

async function readData(request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!isValidId(key)) {
    const response = new Response(
      JSON.stringify({
        success: false,
        message: "Invalid key. Only letters and numbers are allowed.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(response);
    return response;
  }

  const value = await COOKIE_STORE.get(key);
  if (value === null) {
    const response = new Response(
      JSON.stringify({ success: false, message: "Data not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(response);
    return response;
  }
  const response = new Response(
    JSON.stringify({ success: true, data: JSON.parse(value) }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
  setCorsHeaders(response);
  return response;
}

async function updateData(request) {
  const { key, value } = await request.json();

  if (!isValidId(key)) {
    const response = new Response(
      JSON.stringify({
        success: false,
        message: "Invalid key. Only letters and numbers are allowed.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(response);
    return response;
  }

  const existingValue = await COOKIE_STORE.get(key);
  if (existingValue === null) {
    const response = new Response(
      JSON.stringify({ success: false, message: "Data not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(response);
    return response;
  }
  await COOKIE_STORE.put(key, JSON.stringify(value));
  const response = new Response(
    JSON.stringify({ success: true, message: "Data updated successfully" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
  setCorsHeaders(response);
  return response;
}

async function deleteData(request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!isValidId(key)) {
    const response = new Response(
      JSON.stringify({
        success: false,
        message: "Invalid key. Only letters and numbers are allowed.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
    setCorsHeaders(response);
    return response;
  }

  await COOKIE_STORE.delete(key);
  const response = new Response(
    JSON.stringify({ success: true, message: "Data deleted successfully" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
  setCorsHeaders(response);
  return response;
}

async function deleteAllData() {
  const keys = await COOKIE_STORE.list();
  await Promise.all(keys.keys.map((key) => COOKIE_STORE.delete(key.name)));
  const response = new Response(
    JSON.stringify({ success: true, message: "All data deleted successfully" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
  setCorsHeaders(response);
  return response;
}

async function listAllData() {
  const list = await COOKIE_STORE.list();
  const data = [];

  for (const key of list.keys) {
    const value = await COOKIE_STORE.get(key.name);
    data.push({ key: key.name, value: JSON.parse(value) });
  }

  const response = new Response(
    JSON.stringify({
      success: true,
      data: data,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
  setCorsHeaders(response);
  return response;
}
