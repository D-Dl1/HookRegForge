// 测试文件 - 用于验证文件上传功能
function testFunction() {
    console.log("This is a test function");
    return "Hello World";
}

const testObject = {
    method: function() {
        return this.data;
    },
    data: "test data"
};

// 测试函数调用
testFunction();
testObject.method();

// 嵌套对象调用
window.location.href = "https://example.com";

// 复杂调用链
document.querySelector('#test').addEventListener('click', function() {
    testObject.method();
});