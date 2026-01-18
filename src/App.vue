<template>
    <div id="app" v-cloak>
        <router-view :key="$route.fullPath" />
    </div>
</template>

<script>
export default {
    name:
        "App",
    created() {
        this.checkIfInIframe();
    },
    mounted() {
        window.addEventlistener("storage", (e) => {
            if (e.key === "themeId") {
                window.location.reload();
            };
        })

    },

    beforeDestroy() {
        window.removeEventListener("storage")
    },
    methods: {
        checkIfInIframe() {
            if (window.self !== window.top)
                this.removeBackground();
        },
        removeBackground() {
            document.body.style.background = 'transparent';
        }
    }

}

</script>

<style lang="less">
#app {
    width: 100%;
    height: 100%;
}
</style>