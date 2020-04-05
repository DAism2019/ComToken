package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/thinkerou/favicon"
)

func main() {
	app := gin.Default()
	app.Use(favicon.New("./favicon.ico"))
	app.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Welcome to Commemorative Coins of NaturalDAO!")
	})
	app.GET("/mn/token/:tokenID", handleMainnet)
	app.Run(":5050")
}

//主网，用来显示纪念币元数据
func handleMainnet(c *gin.Context) {
	tokenID := c.Params.ByName("tokenID")
	fmt.Println(tokenID)
}
