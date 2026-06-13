<template>
    <div>
        <!-- 固定菜单栏 -->
        <nav class="menu" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
            <!-- 菜单按钮 -->
            <!-- <div class="toggle-button" @click="toggleMenu">
                <img src="/src/assets/icon/menu.svg" alt="Toggle Menu" />
            </div> -->
            <ul>
                <li class="toggle-button" @click="toggleMenu" style="width: 55px;">
                    <a href="javascript:void(0)">
                        <span class="icon">
                            <img src="/src/assets/icon/menu.svg" alt="Toggle Menu" />
                        </span>
                    </a>
                </li>
            </ul>
            <ul :class="{ expanded: isExpanded }">
                <li v-for="item in menuItems" :key="item.name">
                    <a :href="item.link">
                        <!-- <span class="icon">{{ item.icon }}</span> -->
                        <span class="icon"><img :src="item.icon" /></span>
                        <span class="text" v-if="isExpanded">{{ $t(item.name) }}</span>
                    </a>
                </li>
            </ul>
        </nav>

        <!-- 浮动菜单栏 -->
        <!-- <div v-if="isMenuOpen" class="floating-menu" @click.self="closeMenu">
            <ul>
                <li v-for="item in menuItems" :key="item.name">
                <a :href="item.link">
                    <span class="icon"><img :src="item.icon" /></span>
                    <span class="text">{{ $t(item.name) }}</span>
                </a>
                </li>
            </ul>
        </div> -->
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "MenuBar",
    data() {
        return {
            menuItems: [
                { name: "menu.home", icon: "/src/assets/icon/home.svg", link: "/" },
                { name: "menu.task", icon: "/src/assets/icon/task.svg", link: "/task" },
                { name: "menu.report", icon: "/src/assets/icon/report.svg", link: "/report" },
                { name: "menu.calendar", icon: "/src/assets/icon/calendar.svg", link: "/calendar" },
                { name: "menu.setting", icon: "/src/assets/icon/setting.svg", link: "/setting" },
                { name: "menu.about", icon: "/src/assets/icon/about.svg", link: "/about" },
            ],
            // isCollapsed: true, // 控制菜单栏展开或收起
            // isMenuOpen: false
            isExpanded: false,
            collapseTimeout: null as number | null
        };
    },
    methods: {
        toggleMenu() {
            this.isExpanded = !this.isExpanded;
            console.log("the isCollapsed: " + this.isExpanded)
        },
        // closeMenu(){
        //     this.isMenuOpen = false
        // }
        handleMouseEnter() {
            this.clearCollapseTimeout()
        },
        handleMouseLeave() {
            this.setCollapseTimeout()
        },
        setCollapseTimeout() {
            this.clearCollapseTimeout()
            this.collapseTimeout = window.setTimeout(() => {
                this.isExpanded = false;
            }, 2000) // 2 seconds
        },
        clearCollapseTimeout() {
            if (this.collapseTimeout) {
                clearTimeout(this.collapseTimeout)
                this.collapseTimeout = null
            }
        }
    },
    beforeUnmount() {
        this.clearCollapseTimeout()
    }
});
</script>

<style>
.menu {
    padding: 10px 0;
    width: 55px;
    z-index: 100;
    position: fixed;
    /* background-color: rgba(44, 62, 80, 0.3); */
}

.menu .expanded {
    transition: 0.3s;
    width: 200px;
    /* 展开宽度 */
    background-color: rgba(44, 62, 80, 0.3);
}

/* .menu.collapsed {
    width: 55px;
  }
  .menu.collapsed .text {
    display: none;
  } */

.menu ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.menu li {
    margin: 10px 0;

}

.menu a {
    display: flex;
    align-items: center;
    padding: 10px;
    color: white;
    text-decoration: none;
    transition: background 0.3s;
}

.menu a:hover {
    background-color: pink;
    border-radius: 10px;
}

.icon {
    margin-right: 10px;
}

/* 浮动菜单 */
/* .floating-menu {
    position: fixed;
    top: 60px;
    left: 55px;
    width: 150px;
    height: auto;
    
  }

  .floating-menu ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .floating-menu li {
    margin: 10px 0;
  }

  .floating-menu a {
    display: flex;
    align-items: center;
    padding: 10px;
    color: white;
    text-decoration: none;
    transition: background 0.3s;
  }

  .floating-menu a:hover {
    background-color: pink;
    border-radius: 10px;
  } */
</style>