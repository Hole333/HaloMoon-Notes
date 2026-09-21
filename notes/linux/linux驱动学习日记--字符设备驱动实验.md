---
title: '(FUCK_4) linux驱动初探---字符设备驱动实验'
description: '对于字符设备在linux中是以内核模块的形式存在，因此我们需要向系统注册新的字符设备就需要字符设备结构体 cdev, 设备编号 devt , 操作方式结构体 fileoperations.'
created: '2026-09-21'
updated: '2026-09-21'
tags: ['linux']
draft: false
---
对于字符设备在linux中是以内核模块的形式存在，因此我们需要向系统注册新的字符设备就需要字符设备结构体 cdev, 设备编号 dev_t , 操作方式结构体 file_operations.

同理与开发内核模块的方案一致，编写内核模块代码, 首先我们先实现file_operations 的操作文件操作函数，由于教程里将file_operations 和 模块主体函数写在一块了，但对于笔者来说，这种紧耦合的方式并不是适合于项目开发，因此将file_operations 单独拆分为新的源代码文件

```C
// file_operations.h 头文件
#ifndef __FILE_OPERATIONS_H
#define __FILE_OPERATIONS_H
// 包含一下需要的内核头文件
#include <linux/kernel.h>
#include <linux/fs.h>

// 向外部文件暴露的文件操作符指针
struct file_operations* get_fop_pointer(void);

#endif
```

```C
// file_operations.c 源代码文件
#include "file_operations.h"

// 头部定义
static int chr_dev_open(struct inode* inode, struct file* fp);
static int chr_dev_release(struct inode *inode, struct file* fp);
static ssize_t chr_dev_write(struct file *fp, const char __user *buf, 
                             size_t count, loff_t *ppos);
static ssize_t chr_dev_read(struct file *fp, char __user *buf,
                            size_t count, loff_t *ppos);


struct file_operations chr_dev_fops =
{
    .owner = THIS_MODULE,
    .open = chr_dev_open,
    .release = chr_dev_release,
    .write  = chr_dev_write,
    .read  = chr_dev_read,
};

// 定义一个读写缓冲区 128Byte
#define BUF_SIZE (128)
// 声明设备读写缓冲区
static char vbuf[BUF_SIZE];
// 在用户端会读取这个字段
static char data[] = {"chardev driver"};


// 打开字符设备
static int chr_dev_open(struct inode* inode, struct file* fp)
{
  	// 打印一下状态
    printk(KERN_INFO"chardev open \r\n");
    // 将文件设备读写缓冲区指针首地址赋值给private_data
    fp->private_data = vbuf;
    return 0;
}

// 释放字符设备
static int chr_dev_release(struct inode *inode, struct file* fp)
{
    printk(KERN_INFO"chardev release \r\n");
    return 0;
}

// 设备底层写函数
static ssize_t chr_dev_write(struct file *fp, const char __user *buf, 
                             size_t count, loff_t *ppos)
{
    int ret = 0;
    char *vbuf = fp->private_data; // 获取文件结构体保存的缓冲区地址
    ret = copy_from_user(vbuf, buf, count); // 从用户存储区拷贝到缓冲区
    if (ret == 0)
    {
        printk(KERN_INFO"write data: %s \r\n", vbuf);
    } 
    else
    {
        printk(KERN_ERR"write data fail \r\n");
    }
    return 0;
}

// 设备底层读函数
static ssize_t chr_dev_read(struct file *fp, char __user *buf,
                            size_t count, loff_t *ppos)
{
    int ret = 0;
    char* vbuf = fp->private_data; 
    memcpy(vbuf, data, count); //将待读取的字符串拷贝到读写缓冲区 
    ret = copy_to_user(buf, vbuf, count); // 将读写缓冲区内容拷贝到用户内存区
    if (ret != 0)
    {
        printk(KERN_ERR"read fail \r\n");
    }
    return 0;
}

struct file_operations* get_fop_pointer(void)
{
    return &chr_dev_fops; // 返回file_operations 指针
}
```

以下为应用测试代码

```C
#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>
#include <string.h>

int main(int argc, char *argv[])
{
	int fd, ret;
	char *file_path;
	char user_data[] = "Hello World \r\n";
	char wbuf[128];
	char rbuf[128];

	if (argc != 2) {
		printf("Error Usage \r\n");
		return -1;
	}

	file_path = argv[1];
	printf(" write words \r\n");
	fd = open(file_path, O_RDWR); // 打开驱动文件，给读写权限
	if (fd < 0) {
		printf("cant open file: %s \r\n", file_path);
		return -1;
	}
	memcpy(wbuf, user_data, sizeof(user_data));
	ret = write(fd, wbuf, strlen(wbuf));
	if (ret < 0) {
		printf("write file %s failed!\n", file_path);
		return -1;
	}

	// 关闭文件
	close(fd);

	sleep(1); // 睡一秒钟

	printf(" read data \r\n");
	fd = open(file_path, O_RDWR);
	if (fd < 0) {
		printf("cant open file: %s \r\n", file_path);
		return -1;
	}
	ret = read(fd, rbuf, 128);
	if (ret < 0) {
		printf("read file %s failed!\n", file_path);
		return -1;
	} else {
		printf("read data:%s\n", rbuf);
	}

    close(fd);
    return 0;
}
```

对于Makefile的文件相应也需要进行修改

```CMake
KERNEL_DIR = ../..
ARCH = arm64
CROSS_COMPILE = aarch64-linux-gnu-

export ARCH CROSS_COMPILE

# 追加编译参数 -I 参数增加头文件搜索目录 $(src)当前模块源码目录 /include 头文件存放区域
ccflags-y += -I$(src)/include
obj-m += chardev_module.o
# chardev_module 依赖 chardev 和 file_operations
chardev_module-y := chardev.o file_operations.o 
test_app = chardev_app

all:
	$(MAKE) -C $(KERNEL_DIR) M=$(CURDIR) modules
	$(CROSS_COMPILE)gcc -o $(test_app) $(test_app).c

.PHONY: clean
clean:
	$(MAKE) -C $(KERNEL_DIR) M=$(CURDIR) clean
	rm $(test_app)
```

实际的操作步骤与上一章节的模块导入一致

```Shell
 adb push chardev_module.ko /lib/modules # 从物理机使用adb推送到板卡
 adb push chardev_app /home/ftp 	# 将应用层测试文件推送到板卡
 cd /lib/modules # 安装到模块文件夹内
 inmod chardev_module.ko # 加载模块到内核
```

而在载入模块之后，会优先进入模块进入的初始化函数，先执行字符设备分配设备号，绑定file_operations操作函数，加入到linux内核散列表，在sysfs创建一个设备类，然后在/dev 中创建设备文件。载入之后可以使用测试APP应用文件进行测试。

```Shell
root@ATK-DLRK3568:/lib/modules# cd /home/ftp/
root@ATK-DLRK3568:/home/ftp# ls
chardev_app
root@ATK-DLRK3568:/home/ftp# ./chardev_app /dev/chardev
 write words
[ 4416.057662] chardev open
[ 4416.057727] write data: Hello World
[ 4416.057727]
[ 4416.057741] chardev release
 read data
[ 4417.058301] chardev open
read data:chardev driver
[ 4417.058528] chardev release
```

最后的测试执行结果符合预期，至此完成了一套驱动程序的开发，但是假如我们需要让一套驱动程序可以驱动多个同类型的设备，我们需要怎么做呢。

## 同类型多设备驱动

### 方法1: 多设备枚举

了解方法1的同类型多设备驱动复用其实很简单，因为内核模块创建的是一个抽象的字符设备，也就是代表这个字符设备驱动是可用的，但是应用到这个字符设备驱动实际的操作设备有多个，比如我在linux平台下挂在了多个相同的芯片，其通讯协议为IIC，但是操作的寄存器都是一致的，区别不同点就是每个芯片的地址不同，第一个是 0x01，第二个是0x02  etc... 也就是说，我们可以在模块初始化的过程中，在设备创建时，对设备进行枚举，以次设备号的方式作为下标对真实设备进行区分。以下是关键修改点

```C
// chardev_module.c中
// 逐个在 /dev 创建字符设备驱动文件
    for (i = 0; i < DEV_CNT; i++)
    {
        // 枚举创建多个字符设备文件
        device[i] = device_create(class, NULL, 
                                  devno + i, NULL,
                                  "chardev%d", i);
        if(IS_ERR(device[i]))
        {
            printk("fail to create device\n");
            goto device_err;
        }
        printk("create device: chardev%d \r\n", i);
    }
    return 0;
device_err:
    // 创建设备文件失败，销毁已经创建的设备文件和设备类
    for (i = 0; i < DEV_CNT; i++)
    {
        device_destroy(class, devno + i);
    }
    class_destroy(class);
```

```C
// file_operations.c 中
static char vbuf_1[BUF_SIZE];
static char vbuf_2[BUF_SIZE];
static char vbuf_3[BUF_SIZE];
static char vbuf_4[BUF_SIZE];
static char data[] = {"chardev driver"};


// 打开字符设备
static int chr_dev_open(struct inode* inode, struct file* fp)
{
    printk(KERN_INFO"chardev open\r\n");
    printk("file operate chardev%d \r\n", (MINOR(inode->i_rdev)));
#ifdef MUTI_DEVICE
    switch (MINOR(inode->i_rdev))
    {
    case 0: fp->private_data = vbuf_1; break;
    case 1: fp->private_data = vbuf_2; break;
    case 2: fp->private_data = vbuf_3; break;
    case 3: fp->private_data = vbuf_4; break;
    default:
        break;
    }
#else
    fp->private_data = vbuf;
#endif 
    return 0;
}
```

同样经过编译，然后使用adb push的方式上传到板卡，进行验证

```Shell
root@ATK-DLRK3568:/lib/modules# insmod chardev_module.ko
[  899.742525] chrdev_init
[  899.742609] cdev_init
[  899.742622] cdev add to hash map
[  899.742739] create class
[  899.743117] create device: chardev0
[  899.743287] create device: chardev1
[  899.743420] create device: chardev2
[  899.743530] create device: chardev3
[  899.743645] create device: chardev4
root@ATK-DLRK3568:/dev# ls -lh chardev*
crw------- 1 root root 234, 0 Sep 21 10:33 chardev0
crw------- 1 root root 234, 1 Sep 21 10:33 chardev1
crw------- 1 root root 234, 2 Sep 21 10:33 chardev2
crw------- 1 root root 234, 3 Sep 21 10:33 chardev3
crw------- 1 root root 234, 4 Sep 21 10:33 chardev4
```

可以看到shell日志中打印了创建的各个设备，而在 /dev 文件夹下也确实出现了对应的字符设备文件，因此我们就可以使用测试app对每个字符设备文件做读写测试

```Shell
root@ATK-DLRK3568:/home/ftp# ./chardev_app /dev/chardev0
 write words
[ 1696.159097] chardev open
[ 1696.159152] file operate chardev0
[ 1696.159172] write data: Hello World
[ 1696.159172]
[ 1696.159185] chardev release
 read data
[ 1697.159748] chardev open
read data:chardev driver
[ 1697.159824] file operate chardev0
[ 1697.160003] chardev release
root@ATK-DLRK3568:/home/ftp# ./chardev_app /dev/chardev1
[ 1699.849536] chardev open
 write words
[ 1699.849595] file operate chardev1
[ 1699.849614] write data: Hello World
[ 1699.849614]
[ 1699.849628] chardev release
 read data
[ 1700.850414] chardev open
[ 1700.850488] file operate chardev1
[ 1700.850956] chardev release
read data:chardev driver
root@ATK-DLRK3568:/home/ftp# ./chardev_app /dev/chardev2
 write words
[ 1703.668646] chardev open
[ 1703.668704] file operate chardev2
[ 1703.668724] write data: Hello World
[ 1703.668724]
[ 1703.668736] chardev release
 read data
[ 1704.669304] chardev open
read data:chardev driver
[ 1704.669382] file operate chardev2
[ 1704.669588] chardev release
root@ATK-DLRK3568:/home/ftp# ./chardev_app /dev/chardev3
 write words
[ 1707.535482] chardev open
[ 1707.535563] file operate chardev3
[ 1707.535603] write data: Hello World
[ 1707.535603]
[ 1707.535640] chardev release
 read data
[ 1708.536225] chardev open
read data:chardev driver
[ 1708.536303] file operate chardev3
[ 1708.536519] chardev release
```

可以看到读写测试均可以通过。

### 方法2: 结构体封装 + container_of

使用结构体封装加上container_of宏函数的方式，是以面向对象的方式构建字符设备，基本原理是，将字符设备cdev和其它有关于字符设备相关的属性封装为一个结构体，每个独立的结构体被看作为一个对象，因此如果有很多个这样的结构体，就会有很多个相同封装结构的对象。最后使用统一的container_of管理，即可实现优雅的多对象的管理

在编写代码前，我们需要了解container_of 宏函数的用法，其源代码如下，看着十分难理解

```C
/**
 * container_of - cast a member of a structure out to the containing structure
 * @ptr:	the pointer to the member.
 * @type:	the type of the container struct this is embedded in.
 * @member:	the name of the member within the struct.
 *
 */
#define container_of(ptr, type, member) ({				\
	void *__mptr = (void *)(ptr);					\
	BUILD_BUG_ON_MSG(!__same_type(*(ptr), ((type *)0)->member) &&	\
			 !__same_type(*(ptr), void),			\
			 "pointer type mismatch in container_of()");	\
	((type *)(__mptr - offsetof(type, member))); })
```

让我们拆解来看这段代码 ，第一段代码，局部声明一个指针去指向传入的指针，传入的指针必须为被声明结构体当中的一个成员，也就是获得的是被声明结构体成员的地址

```C
void *__mptr = (void *)(ptr);
```

而下一段代码，是用来判断给出的结构体成员是否在给定type也就是结构体当中

```C
BUILD_BUG_ON_MSG(!__same_type(*(ptr), ((type *)0)->member) &&	\
			 !__same_type(*(ptr), void),			\
			 "pointer type mismatch in container_of()");
```

最后一段代码也就是 通过传入的成员地址减去这个成员在结构体当中的地址偏移，就可以得到这个对象的结构体首地址，也就是获得了这个成员的对象

```C
((type *)(__mptr - offsetof(type, member)));
```

由于每个对象的首地址都是不同的，所以可以使用这个container_of 的方法管理所有同类型的成员

了解了这个机制，我们可以想到，由于方法1会声明很多个全局的缓存，而导致每次编码增加一个成员就要多写个缓存变量，还需要多写个switch分支，因此我们可以把全局独立缓存作为一个成员和cdev一起组成一个结构体

```C
struct Mutichrdevice_t
{
    struct cdev chr_dev;    // 每个设备单独一个字符设备入口
    char vbuf[BUFFER_SIZE]; // 单独一个缓冲区
};
```

下一步就可以根据定义的字符设备的数量去定义有多少个这样的结构体

```C
#define DEV_CNT (5)
// 定义设备号
static dev_t devno;
// 定义设备结构体
static struct Mutichrdevice_t chr_devices[DEV_CNT];
// 定义设备类结构体，在sysfs创建设备类
struct class *class;
// 定义设备结构体，用于/dev 下创建设备文件
struct device *device[DEV_CNT];
```

由于每个字符设备与上一个方法不同，在创建的过程中都会有一个inode指向特定的cdev，因此每个cdev都需要做一次初始化，绑定文件操作函数，加入到字符设备散列表

```C
static int __init chrdev_init(void)
{
    int ret = 0;
    uint8_t i = 0;
    printk(KERN_INFO"chrdev_init \r\n");
  
    // 动态分配字符设备号  
    ret = alloc_chrdev_region(&devno, 0, DEV_CNT, DEV_NAME);
    if (ret < 0)
    {
        printk(KERN_ERR"fail to allocate device number \r\n");
        goto alloc_err;
    }
    // 在sysfs创建设备类
    class = class_create(THIS_MODULE, DEV_NAME);
    if (IS_ERR(class))
    {
        printk("fail to add class\n");
        goto class_err;  
    }
    printk("create class \r\n");
    for (i = 0; i < DEV_CNT; i++)
    {
        chr_devices[i].chr_dev.owner = THIS_MODULE;
        cdev_init(&chr_devices[i].chr_dev, get_fop_pointer()); // 绑定文件操作符
        ret = cdev_add(&chr_devices[i].chr_dev, MKDEV(MAJOR(devno), i), 1); // 添加单独设备到散列表
        printk("cdev:%d %d add to hash map \r\n", MAJOR(devno), i);
        if (ret < 0)
        {
            // 若添加失败，打印错误信息并跳转到错误处理标签
            printk("fail to add cdev\n");
            goto add_err;
        }
        // 创建对应字符设备文件
        device[i] = device_create(class, NULL,  
                                  MKDEV(MAJOR(devno), i), NULL, 
                                  "mutichardev%d", i); 
        if(IS_ERR(device[i]))
        {
            printk("fail to create device\n");
            goto device_err;
        }
        printk("create device: chardev%d \r\n", i);
      
    }
    return 0;
device_err:
    // 创建设备文件失败，销毁已经创建的设备文件和设备类
    for (i = 0; i < DEV_CNT; i++)
    {
        device_destroy(class, devno + i);
    }
    class_destroy(class);
class_err:
    // 创建设备类失败，移除字符设备
    while (i--)
    {
        cdev_del(&chr_devices[i].chr_dev);
    }
add_err:
    // 注销分配的设备号
    unregister_chrdev_region(devno, DEV_CNT);
alloc_err:
    return ret;  
}
```

而对于file_operations 的操作也相比方法1更加的简洁明了，使用container_of 即可获得目标操作字符设备的地址。

```C
// 打开字符设备
static int chr_dev_open(struct inode* inode, struct file* fp)
{
    printk(KERN_INFO"chardev open\r\n");
    printk("file operate chardev%d \r\n", (MINOR(inode->i_rdev)));
    fp->private_data = container_of(inode->i_cdev, struct Mutichrdevice_t, chr_dev);
    return 0;
}
```

由于fp -> private_data 赋值的是这个实例化的结构体封装的头指针， 因此后续需要使用到对象当中的读写缓冲区的成员，需要明确指向读写缓冲区成员

```C
// 以此为例子
struct Mutichrdevice_t *chr = fp->private_data;
char *vbuf = chr->vbuf; // 获取文件结构体保存的缓冲区地址
ret = copy_from_user(vbuf, buf, count);
```

这样局部的更改就实现了面向对象的多个相同字符设备的优雅控制，对其编译，上传，并执行。

```Shell
root@ATK-DLRK3568:/lib/modules# insmod chardev_module.ko
[19244.703485] chrdev_init
[19244.703690] create class
[19244.703710] cdev:234 0 add to hash map
[19244.704164] create device: chardev0
[19244.704183] cdev:234 1 add to hash map
[19244.704414] create device: chardev1
[19244.704429] cdev:234 2 add to hash map
[19244.704677] create device: chardev2
[19244.704692] cdev:234 3 add to hash map
[19244.704941] create device: chardev3
[19244.704962] cdev:234 4 add to hash map
[19244.705133] create device: chardev4
root@ATK-DLRK3568:/lib/modules# ls /dev/mutichardev*
/dev/mutichardev0  /dev/mutichardev2  /dev/mutichardev4
/dev/mutichardev1  /dev/mutichardev3
```

成功的导入了内核模块，并创建了五个字符设备的操作文件

```Shell
root@ATK-DLRK3568:/home/ftp# ./chardev_app /dev/mutichardev0
 write words
[19316.135108] chardev open
[19316.135165] file operate chardev0
[19316.135182] write data: Hello World
[19316.135182]
[19316.135197] chardev release
[19317.135631] chardev open
 read data
[19317.135712] file operate chardev0
read data:chardev driver
[19317.135906] chardev release
root@ATK-DLRK3568:/home/ftp# ./chardev_app /dev/mutichardev1
 write words
[19319.260956] chardev open
[19319.261011] file operate chardev1
[19319.261029] write data: Hello World
[19319.261029]
[19319.261042] chardev release
 read data
[19320.261485] chardev open
read data:chardev driver
[19320.261563] file operate chardev1
[19320.261759] chardev release
root@ATK-DLRK3568:/home/ftp# ./chardev_app /dev/mutichardev2
 write words
[19322.166628] chardev open
[19322.166693] file operate chardev2
[19322.166717] write data: Hello World
[19322.166717]
[19322.166742] chardev release
 read data
[19323.167295] chardev open
read data:chardev driver
[19323.167380] file operate chardev2
[19323.167591] chardev release
root@ATK-DLRK3568:/home/ftp# ./chardev_app /dev/mutichardev3
[19325.275885] chardev open
 write words
[19325.275944] file operate chardev3
[19325.275962] write data: Hello World
[19325.275962]
[19325.275975] chardev release
 read data
[19326.276742] chardev open
read data:chardev driver
[19326.276819] file operate chardev3
[19326.277083] chardev release
root@ATK-DLRK3568:/home/ftp# ./chardev_app /dev/mutichardev4
[19328.855914] chardev open
 write words
[19328.855975] file operate chardev4
[19328.855990] write data: Hello World
[19328.855990]
[19328.856002] chardev release
 read data
[19329.856809] chardev open
read data:chardev driver
[19329.856890] file operate chardev4
[19329.857070] chardev release
```

最终测试的结果与方法一结果一致
