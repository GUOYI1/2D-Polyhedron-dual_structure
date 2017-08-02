//This file includes some useful mathematical solutions that can be used in WebGL.Three.js and numeric.js need to be included
function GetEdgeNormal2D(vector)
{
    return new THREE.Vector3(-vector.y,vector.x,0).normalize();
}
function Line_intersection_2D(A1,B1,C1,A2,B2,C2)
{
	//A1X+B1Y+C1=A2X+B2Y+C2
	var x=numeric.solve([[A1,B1],[A2,B2]],[-C1,-C2]);
	return x;
}

//Extension for numeric.js
function Maxium_Linear_Independent_Group(m){
    'use strict'
    var matrix=numeric.transpose(m);
    var result=new Array();
    var lead = 0;
    var rows=matrix.length;
    var cols=matrix[0].length;
    for (var r = 0; r < rows; r++) {
        if (cols <= lead) {
            break;
        }
        var i = r;
        while (matrix[i][lead] == 0) {
            i++;
            if (rows == i) {
                i = r;
                lead++;
                if (cols == lead) {
                    break;
                }
            }
        }
        if (cols == lead) break;

        var tmp = matrix[i];
        matrix[i] = matrix[r];
        matrix[r] = tmp;
 
        var val = matrix[r][lead];
        for (var j = 0; j < cols; j++) {
            matrix[r][j] /= val;
        }
        for (var i = 0; i < rows; i++) {
            if (i == r) continue;
            val = matrix[i][lead];
            for (var j = 0; j < cols; j++) {
                matrix[i][j] -= val * matrix[r][j];
            }
        }
        lead++;
    }

    for(var i=0;i<matrix.length;i++){
        var flag=false;
        for(var j=0;j<matrix[i].length;j++){
            if(matrix[i][j]){
                flag=true;
                result.push(m[j]);
                break;
            }
        } 
        if(!flag) break; 
    }  
    return result; 
}