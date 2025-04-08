// public/js/main.js
// Kiểm tra trạng thái đăng nhập
let isLoggedIn = false;
let userRole = null;

// Tải danh sách sản phẩm
function loadProducts() {
  if (document.getElementById("product-list")) {
    fetch("/products", { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById("product-list");
        container.innerHTML = ''; // Xóa nội dung cũ
        if (data.success && data.data.length > 0) {
          data.data.forEach(p => {
            const div = document.createElement("div");
            div.innerHTML = `
              <img src="${p.imgURL || 'https://via.placeholder.com/150'}" alt="${p.productName}" />
              <h4>${p.productName}</h4>
              <p>Giá: ${p.price}₫</p>
              <p>Số lượng: ${p.quantity}</p>
              <p>Danh mục: ${p.categoryID.categoryName}</p>
              <p>Mô tả: ${p.description || 'Không có'}</p>
              <button class="add-to-cart-btn" onclick="addToCart('${p._id}')">Thêm vào giỏ hàng</button>
              ${isLoggedIn && userRole === 'admin' ? `
                <button class="action-btn edit-btn" onclick="openModal('editProduct', '${p._id}')">Sửa</button>
                <button class="action-btn delete-btn" onclick="deleteProduct('${p._id}')">Xóa</button>
              ` : ''}
            `;
            container.appendChild(div);
          });
        } else {
          container.innerHTML = '<p>Không có sản phẩm nào!</p>';
        }
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        document.getElementById("product-list").innerHTML = '<p>Lỗi khi tải sản phẩm!</p>';
      });
  }
}

// Thêm sản phẩm vào giỏ hàng
async function addToCart(productId) {
  try {
    const response = await fetch('/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId, quantity: 1 })
    });
    const data = await response.json();

    if (data.success) {
      showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success');
    } else {
      if (response.status === 401) {
        showToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!', 'error');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1500);
      } else {
        showToast('Lỗi khi thêm sản phẩm: ' + data.message, 'error');
      }
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Lỗi khi thêm sản phẩm vào giỏ hàng!', 'error');
  }
}

// Tải danh sách danh mục
function loadCategories() {
  if (document.getElementById("category-list")) {
    fetch("/categories", { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const ul = document.getElementById("category-list");
        ul.innerHTML = ''; // Xóa nội dung cũ
        if (data.success && data.length > 0) {
          data.forEach(cat => {
            const li = document.createElement("li");
            li.innerHTML = `
              <span>${cat.categoryName}</span>
              ${isLoggedIn && userRole === 'admin' ? `
                <div>
                  <button class="action-btn edit-btn" onclick="openModal('editCategory', '${cat._id}')">Sửa</button>
                  <button class="action-btn delete-btn" onclick="deleteCategory('${cat._id}')">Xóa</button>
                </div>
              ` : ''}
            `;
            ul.appendChild(li);
          });
        } else {
          ul.innerHTML = '<p>Không có danh mục nào!</p>';
        }
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        document.getElementById("category-list").innerHTML = '<p>Lỗi khi tải danh mục!</p>';
      });
  }
}

// Hàm mở modal để thêm hoặc sửa
function openModal(type, id = null) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');

  if (type === 'addProduct' || type === 'editProduct') {
    fetch('/categories', { credentials: 'include' })
      .then(res => res.json())
      .then(categories => {
        let formHTML = `
          <h2>${type === 'addProduct' ? 'Thêm Sản Phẩm' : 'Sửa Sản Phẩm'}</h2>
          <form id="productForm">
            <label for="productName">Tên Sản Phẩm:</label>
            <input type="text" id="productName" name="productName" required>
            
            <label for="price">Giá:</label>
            <input type="number" id="price" name="price" min="0" required>
            
            <label for="quantity">Số Lượng:</label>
            <input type="number" id="quantity" name="quantity" min="0" required>
            
            <label for="description">Mô Tả:</label>
            <textarea id="description" name="description"></textarea>
            
            <label for="image">Hình Ảnh:</label>
            <input type="file" id="image" name="image" accept="image/*">
            <img id="imagePreview" src="" alt="Preview" style="display: none;" />
            
            <label for="categoryID">Danh Mục:</label>
            <select id="categoryID" name="categoryID" required>
              <option value="">Chọn danh mục</option>
              ${categories.success && categories.data ? categories.data.map(cat => `<option value="${cat._id}">${cat.categoryName}</option>`).join('') : ''}
            </select>
            
            <button type="submit">${type === 'addProduct' ? 'Thêm' : 'Cập Nhật'}</button>
          </form>
          <div id="formMsg" class="text-center"></div>
          <div class="loading" id="formLoading"></div>
        `;
        modalBody.innerHTML = formHTML;

        const imageInput = document.getElementById('image');
        const imagePreview = document.getElementById('imagePreview');
        imageInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = 'block';
          } else {
            imagePreview.style.display = 'none';
          }
        });

        if (type === 'editProduct') {
          fetch(`/products/${id}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                const product = data.data;
                document.getElementById('productName').value = product.productName;
                document.getElementById('price').value = product.price;
                document.getElementById('quantity').value = product.quantity;
                document.getElementById('description').value = product.description || '';
                if (product.imgURL) {
                  imagePreview.src = product.imgURL;
                  imagePreview.style.display = 'block';
                }
                document.getElementById('categoryID').value = product.categoryID._id;
              } else {
                showToast('Lỗi khi tải sản phẩm: ' + data.message, 'error');
              }
            })
            .catch(error => {
              console.error('Error fetching product:', error);
              showToast('Lỗi khi tải sản phẩm!', 'error');
            });
        }

        document.getElementById('productForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const imageFile = formData.get('image');
          const msg = document.getElementById('formMsg');
          const loading = document.getElementById('formLoading');

          msg.innerHTML = '';
          loading.style.display = 'block';

          try {
            let productData;
            if (imageFile && imageFile.size > 0) {
              const uploadData = new FormData();
              uploadData.append('image', imageFile);
              const uploadResponse = await fetch('/upload', {
                method: 'POST',
                body: uploadData,
                credentials: 'include'
              });
              const uploadDataResult = await uploadResponse.json();
              if (uploadDataResult.success) {
                formData.delete('image');
                productData = Object.fromEntries(formData);
                productData.imgURL = uploadDataResult.filePath;
              } else {
                throw new Error(uploadDataResult.message);
              }
            } else {
              formData.delete('image');
              productData = Object.fromEntries(formData);
              if (type === 'editProduct') {
                const productResponse = await fetch(`/products/${id}`, { credentials: 'include' });
                const productDataResult = await productResponse.json();
                if (productDataResult.success) {
                  productData.imgURL = productDataResult.data.imgURL;
                }
              } else {
                productData.imgURL = '';
              }
            }

            if (type === 'addProduct') {
              await addProduct(productData);
            } else {
              await updateProduct(id, productData);
            }
          } catch (error) {
            loading.style.display = 'none';
            msg.innerHTML = `<div class="alert alert-danger">Lỗi: ${error.message}</div>`;
          }
        });
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        showToast('Lỗi khi tải danh mục!', 'error');
      });
  } else if (type === 'addCategory' || type === 'editCategory') {
    modalBody.innerHTML = `
      <h2>${type === 'addCategory' ? 'Thêm Danh Mục' : 'Sửa Danh Mục'}</h2>
      <form id="categoryForm">
        <label for="categoryName">Tên Danh Mục:</label>
        <input type="text" id="categoryName" name="categoryName" required>
        
        <label for="description">Mô Tả:</label>
        <textarea id="description" name="description"></textarea>
        
        <button type="submit">${type === 'addCategory' ? 'Thêm' : 'Cập Nhật'}</button>
      </form>
      <div id="formMsg" class="text-center"></div>
      <div class="loading" id="formLoading"></div>
    `;

    if (type === 'editCategory') {
      fetch(`/categories/${id}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const category = data.data;
            document.getElementById('categoryName').value = category.categoryName;
            document.getElementById('description').value = category.description || '';
          } else {
            showToast('Lỗi khi tải danh mục: ' + data.message, 'error');
          }
        })
        .catch(error => {
          console.error('Error fetching category:', error);
          showToast('Lỗi khi tải danh mục!', 'error');
        });
    }

    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const categoryData = Object.fromEntries(formData);
      const msg = document.getElementById('formMsg');
      const loading = document.getElementById('formLoading');

      msg.innerHTML = '';
      loading.style.display = 'block';

      try {
        if (type === 'addCategory') {
          await addCategory(categoryData);
        } else {
          await updateCategory(id, categoryData);
        }
      } catch (error) {
        loading.style.display = 'none';
        msg.innerHTML = `<div class="alert alert-danger">Lỗi: ${error.message}</div>`;
      }
    });
  }

  modal.style.display = 'block';
}

// Hàm đóng modal
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

// Thêm sản phẩm
async function addProduct(productData) {
  const response = await fetch('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(productData)
  });
  const data = await response.json();
  const msg = document.getElementById('formMsg');
  const loading = document.getElementById('formLoading');

  loading.style.display = 'none';
  if (data.success) {
    msg.innerHTML = `<div class="alert alert-success">Thêm sản phẩm thành công!</div>`;
    setTimeout(() => {
      closeModal();
      loadProducts();
    }, 1500);
  } else {
    msg.innerHTML = `<div class="alert alert-danger">Lỗi: ${data.message}</div>`;
  }
}

// Cập nhật sản phẩm
async function updateProduct(id, productData) {
  const response = await fetch(`/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(productData)
  });
  const data = await response.json();
  const msg = document.getElementById('formMsg');
  const loading = document.getElementById('formLoading');

  loading.style.display = 'none';
  if (data.success) {
    msg.innerHTML = `<div class="alert alert-success">Cập nhật sản phẩm thành công!</div>`;
    setTimeout(() => {
      closeModal();
      loadProducts();
    }, 1500);
  } else {
    msg.innerHTML = `<div class="alert alert-danger">Lỗi: ${data.message}</div>`;
  }
}

// Xóa sản phẩm
function deleteProduct(id) {
  if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
    fetch(`/products/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('Xóa sản phẩm thành công!', 'success');
          loadProducts();
        } else {
          showToast('Lỗi: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error deleting product:', error);
        showToast('Lỗi khi xóa sản phẩm!', 'error');
      });
  }
}

// Thêm danh mục
async function addCategory(categoryData) {
  const response = await fetch('/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(categoryData)
  });
  const data = await response.json();
  const msg = document.getElementById('formMsg');
  const loading = document.getElementById('formLoading');

  loading.style.display = 'none';
  if (data.success) {
    msg.innerHTML = `<div class="alert alert-success">Thêm danh mục thành công!</div>`;
    setTimeout(() => {
      closeModal();
      loadCategories();
    }, 1500);
  } else {
    msg.innerHTML = `<div class="alert alert-danger">Lỗi: ${data.message}</div>`;
  }
}

// Cập nhật danh mục
async function updateCategory(id, categoryData) {
  const response = await fetch(`/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(categoryData)
  });
  const data = await response.json();
  const msg = document.getElementById('formMsg');
  const loading = document.getElementById('formLoading');

  loading.style.display = 'none';
  if (data.success) {
    msg.innerHTML = `<div class="alert alert-success">Cập nhật danh mục thành công!</div>`;
    setTimeout(() => {
      closeModal();
      loadCategories();
    }, 1500);
  } else {
    msg.innerHTML = `<div class="alert alert-danger">Lỗi: ${data.message}</div>`;
  }
}

// Xóa danh mục
function deleteCategory(id) {
  if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
    fetch(`/categories/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('Xóa danh mục thành công!', 'success');
          loadCategories();
        } else {
          showToast('Lỗi: ' + data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error deleting category:', error);
        showToast('Lỗi khi xóa danh mục!', 'error');
      });
  }
}

// Hàm hiển thị toast notification
function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}