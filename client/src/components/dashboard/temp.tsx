// First legend formatter starting at line 973
<Legend 
  verticalAlign="bottom" 
  height={90} 
  iconSize={18} 
  layout="horizontal" 
  align="center" 
  wrapperStyle={{ 
    paddingTop: "30px", 
    paddingLeft: "40px", 
    paddingRight: "40px" 
  }} 
  formatter={(value, entry) => {
    return <span style={{ 
      marginRight: value === "Usage Count" ? "150px" : "50px", 
      fontSize: "16px", 
      fontWeight: "bold" 
    }}>{value}</span>
  }}
/>

// Second legend formatter starting at line 1087
<Legend 
  verticalAlign="bottom" 
  height={90}
  iconSize={18}
  layout="horizontal"
  align="center"
  wrapperStyle={{ 
    paddingTop: "30px",
    paddingLeft: "40px",
    paddingRight: "40px"
  }}
  formatter={(value, entry) => {
    return <span style={{ 
      marginRight: value === "Usage Count" ? "150px" : "50px", 
      fontSize: "16px", 
      fontWeight: "bold" 
    }}>{value}</span>
  }}
/>